# api.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from langchain_ollama import OllamaLLM
from PIL import Image
from contextlib import asynccontextmanager
import asyncio
import os
from pathlib import Path
import json
from datetime import datetime, date, timedelta, timezone
import traceback
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import uuid

load_dotenv()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "digidoc"

# Hardcoded Gemini credentials (edit these values in-code)
client: genai.Client | None = None

# Optional media processing libs
try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

try:
    from PIL import Image
except Exception:
    Image = None

try:
    import pytesseract
except Exception:
    pytesseract = None

# MongoDB client
mongo_client: AsyncIOMotorClient | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 🌟 Startup Code 🌟 ---
    global client, mongo_client
    print("Application Startup: Initializing Gemini Client and MongoDB...")

    try:
        # Initialize Gemini client
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        print("Gemini client initialized successfully.")
    except Exception as e:
        print(f"ERROR: Could not initialize Gemini client: {e}")

    try:
        # Initialize MongoDB client
        mongo_client = AsyncIOMotorClient(MONGODB_URL)
        # Test the connection
        await mongo_client.admin.command('ping')
        print("MongoDB client initialized successfully.")
    except Exception as e:
        print(f"ERROR: Could not initialize MongoDB client: {e}")

    # Yield control to the application to handle requests
    yield

    # --- 🛑 Shutdown Code (Executed when Ctrl+C is pressed) 🛑 ---
    print("\nApplication Shutdown: Closing clients...")

    if client:
        try:
            client.close()
            print("Gemini client connection closed gracefully.")
        except Exception as e:
            print(f"Warning: Failed to close Gemini client cleanly: {e}")

    if mongo_client:
        try:
            mongo_client.close()
            print("MongoDB client connection closed gracefully.")
        except Exception as e:
            print(f"Warning: Failed to close MongoDB client cleanly: {e}")

    print("All cleanup complete. Application is shutting down.")

app = FastAPI(title="Digital Doctor API", version="1.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # You can restrict this later, e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize Ollama model once
model = OllamaLLM(model="llama3.2:3b")

# MEDIA directory setup
MEDIA_DIR = Path("MEDIA")
MEDIA_DIR.mkdir(exist_ok=True)

# Pydantic models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    about: str
    date_of_birth: date
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str | None = None

class QueryRequest(BaseModel):
    query: str
    chat_id: str
    history: list[dict] | None = None

class MessageData(BaseModel):
    chat_id: str
    sender: str
    text: str
    media: str | None = None
    timestamp: str

class UpdateChatTitleRequest(BaseModel):
    chat_id: str
    title: str

class AboutMeRequest(BaseModel):
    text: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # bcrypt has a 72-byte limit, so truncate the password if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Truncate to 72 bytes and ensure it's valid UTF-8
        truncated_bytes = password_bytes[:72]
        # Find the last complete UTF-8 character
        while len(truncated_bytes) > 0:
            try:
                password = truncated_bytes.decode('utf-8')
                break
            except UnicodeDecodeError:
                # Remove the last byte and try again
                truncated_bytes = truncated_bytes[:-1]
        else:
            # If we can't decode anything, use empty string (shouldn't happen)
            password = ""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        token_data = TokenData(user_id=user_id)
    except (jwt.InvalidTokenError, jwt.DecodeError):
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Verify user exists
    db = mongo_client[DATABASE_NAME]
    user = await db.users.find_one({"_id": ObjectId(token_data.user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# Database helper functions
async def get_db():
    return mongo_client[DATABASE_NAME]

async def create_chat(user_id: str, chat_id: str, title: str = ""):
    db = await get_db()
    chat_doc = {
        "_id": chat_id,
        "user_id": ObjectId(user_id),
        "title": title or chat_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.chats.insert_one(chat_doc)
    return chat_doc

async def save_message(chat_id: str, sender: str, text: str, timestamp: str, media: str = None):
    db = await get_db()
    message_doc = {
        "chat_id": chat_id,
        "sender": sender,
        "text": text,
        "timestamp": timestamp,
        "media": media
    }
    await db.messages.insert_one(message_doc)
    return message_doc

async def get_chat_messages(chat_id: str):
    db = await get_db()
    messages = await db.messages.find({"chat_id": chat_id}).sort("timestamp", 1).to_list(length=None)
    return messages

async def get_user_chats(user_id: str):
    db = await get_db()
    chats = await db.chats.find({"user_id": ObjectId(user_id)}).sort("updated_at", -1).to_list(length=None)
    return chats

async def update_chat_title(chat_id: str, title: str):
    db = await get_db()
    await db.chats.update_one(
        {"_id": chat_id},
        {"$set": {"title": title, "updated_at": datetime.now(timezone.utc)}}
    )

# Endpoints
@app.post("/register", response_model=Token)
async def register_user(user: UserRegister):
    db = await get_db()

    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = get_password_hash(user.password)

    # Create user document
    user_doc = {
        "name": user.name,
        "email": user.email,
        "phone_number": user.phone_number,
        "about": user.about,
        "date_of_birth": user.date_of_birth.isoformat(),
        "password_hash": hashed_password,
        "created_at": datetime.now()
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create access token
    access_token = create_access_token(data={"sub": user_id})

    return Token(access_token=access_token, token_type="bearer")

@app.post("/login", response_model=Token)
async def login_user(user: UserLogin):
    db = await get_db()

    # Find user
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Verify password
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Create access token
    access_token = create_access_token(data={"sub": str(db_user["_id"])})

    return Token(access_token=access_token, token_type="bearer")

@app.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    # Since JWT is stateless, logout is handled on client side
    return {"message": "Successfully logged out"}

@app.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile information.
    """
    return {
        "id": str(current_user["_id"]),
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "phone_number": current_user.get("phone_number"),
        "about": current_user.get("about"),
        "date_of_birth": current_user.get("date_of_birth")
    }


async def sse_token_stream(text: str):
    buff = []

    for ch in text:
        if ch == ' ':
            if buff:
                yield f"{''.join(buff)} "
                buff.clear()
        elif ch == '\n':
            if buff:
                yield f"{''.join(buff)} "
                buff.clear()
            yield "\n\n"
        else:
            buff.append(ch)
        await asyncio.sleep(0.005)

    if buff:
        yield f"{''.join(buff)} "

@app.post("/ask_a")
async def stream_sse(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    # Check if Gemini client is initialized
    if client is None:
        raise HTTPException(status_code=503, detail="Gemini service is not available")
    
    # Ensure chat exists
    db = await get_db()
    chat = await db.chats.find_one({"_id": request.chat_id, "user_id": ObjectId(current_user["_id"])})
    if not chat:
        await create_chat(str(current_user["_id"]), request.chat_id)

    contents = []
    if request.history:
        for msg in request.history:
            contents.append(types.Content(
                role=msg.get("role"),
                parts=[types.Part(text=p) for p in msg.get("parts", [])]
            ))
            
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=request.query.strip())]
    ))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction="""
            ## Role
You are a highly qualified Medical Consultant specializing in health guidance for the Indian population. Your goal is to provide evidence-based, concise, and culturally relevant medical information.

## Core Guidelines
1. **Context & Scope:** Use provided context (medical history/lab results) as the primary source of truth. If a query is non-medical, state: "I am specialized in medical queries only and cannot assist with this topic."
2. **Indian Context:** - Use metric units (cm, kg, Celsius) and common Indian health terminology.
   - Acknowledge local factors where relevant (e.g., climate-related illness, common dietary habits).
3. **Response Structure:**
   - Use Markdown (bolding, bullet points, numbered lists) for scannability.
   - **Limit response to 200 words.**
4. **No Image Found" 
   - The context doesnt contain any images. If the user asks about an image, do not mention that image was not provided.
## Symptom Analysis & Triage
If a user presents symptoms, you must include a **Triage Analysis** section at the beginning:
- **Risk Level:** (Low / Moderate / High)
- **Urgency:** (Monitor / Schedule Appointment / Urgent Care)
- **Status:** (Routine / Emergency)

*If the condition appears critical (e.g., chest pain, difficulty breathing, severe bleeding), immediately advise the user to call 102 or 108 (India Emergency Services) or visit the nearest Accident & Emergency (A&E) ward.*

## General Queries
For non-symptomatic queries (e.g., "What is Vitamin D?"), provide a direct, informative explanation without the triage block.
            """,)
    )
    huge_markdown_output = response.text

    # Update chat updated_at
    await db.chats.update_one(
        {"_id": request.chat_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    return StreamingResponse(sse_token_stream(huge_markdown_output), media_type="text/plain")

@app.post("/save-message")
async def save_message_endpoint(message: MessageData, current_user: dict = Depends(get_current_user)):
    """
    Save message metadata to database
    """
    # Ensure chat exists and belongs to user
    db = await get_db()
    chat = await db.chats.find_one({"_id": message.chat_id, "user_id": ObjectId(current_user["_id"])})
    if not chat:
        await create_chat(str(current_user["_id"]), message.chat_id)

    await save_message(message.chat_id, message.sender, message.text, message.timestamp, message.media)

    # Update chat updated_at
    await db.chats.update_one(
        {"_id": message.chat_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    return {
        "status": "success",
        "message": "Message saved successfully",
        "chat_id": message.chat_id
    }

@app.get("/chat-data/{chat_id}")
async def get_chat_data(chat_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve all messages for a specific chat
    """
    # Verify chat belongs to user
    db = await get_db()
    chat = await db.chats.find_one({"_id": chat_id, "user_id": ObjectId(current_user["_id"])})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = await get_chat_messages(chat_id)

    # Serialize messages properly (convert ObjectId and datetime to strings)
    serialized_messages = []
    media_files = []
    
    for msg in messages:
        serialized_msg = {
            "sender": msg.get("sender"),
            "text": msg.get("text"),
            "timestamp": msg.get("timestamp"),
            "media": msg.get("media")
        }
        serialized_messages.append(serialized_msg)
        
        if msg.get("media"):
            media_files.append(msg["media"])

    return {
        "messages": serialized_messages,
        "media_files": list(set(media_files)),  # Remove duplicates
        "chat_id": chat_id
    }

@app.get("/user/media")
async def get_user_media(current_user: dict = Depends(get_current_user)):
    """
    Retrieve all media files uploaded by the user across all chats.
    """
    db = await get_db()
    
    # 1. Get all chat IDs for the user
    user_chats = await db.chats.find(
        {"user_id": ObjectId(current_user["_id"])},
        {"_id": 1}
    ).to_list(length=None)
    
    chat_ids = [str(chat["_id"]) for chat in user_chats]
    
    if not chat_ids:
        return {"media_files": []}

    # 2. Find messages in these chats that have media
    messages = await db.messages.find(
        {
            "chat_id": {"$in": chat_ids},
            "media": {"$ne": None}
        }
    ).sort("timestamp", -1).to_list(length=None)

    media_files = []
    seen_files = set()

    for msg in messages:
        if msg.get("media"):
            # Create a unique key to prevent duplicates if references exists
            # Assuming per-chat unique filenames or global unique? 
            # In process_image we save to chat specific folder.
            # But here we just want a list.
            
            # Simple deduplication based on filename + chat_id
            unique_key = f"{msg['chat_id']}_{msg['media']}"
            if unique_key not in seen_files:
                media_files.append({
                    "name": msg["media"],
                    "chat_id": msg["chat_id"],
                    "timestamp": msg.get("timestamp")
                })
                seen_files.add(unique_key)

    return {"media_files": media_files}

@app.get('/media/{chat_id}/{filename}')
async def serve_media(chat_id: str, filename: str, token: str):
    """Serve media file for a given chat. Returns FileResponse."""
    # Manually verify token since we're using query param
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
             raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except (jwt.InvalidTokenError, jwt.DecodeError):
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Verify chat belongs to user
    db = await get_db()
    chat = await db.chats.find_one({"_id": chat_id, "user_id": ObjectId(user_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    media_path = MEDIA_DIR / chat_id / filename
    if not media_path.exists():
        raise HTTPException(status_code=404, detail='File not found')
    
    from fastapi.responses import FileResponse
    return FileResponse(path=str(media_path), filename=filename, content_disposition_type="inline")

@app.post('/process-image')
async def process_image(
    chat_id: str = Form(...),
    file: UploadFile = File(...),
    prompt: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Process an uploaded media file, extract text (PDF or image), summarize via the LLM and stream the summary.

    Accepts multipart/form-data with fields:
    - chat_id (form)
    - file (upload)
    - prompt (form, optional)
    """
    # Check if Gemini client is initialized
    if client is None:
        raise HTTPException(status_code=503, detail="Gemini service is not available")
    
    # Verify chat belongs to user
    db = await get_db()
    chat = await db.chats.find_one({"_id": chat_id, "user_id": ObjectId(current_user["_id"])})
    if not chat:
        await create_chat(str(current_user["_id"]), chat_id)

    # Restrict allowed file types
    filename = file.filename or "uploaded"
    lower = filename.lower()
    allowed_ext = ('.pdf', '.png', '.jpg', '.jpeg')
    if not lower.endswith(allowed_ext):
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_ext)}")

    is_image = lower.endswith(('.png', '.jpg', '.jpeg'))

    try:
        # Create chat media directory
        chat_media_dir = MEDIA_DIR / chat_id
        chat_media_dir.mkdir(exist_ok=True)
        file_path = chat_media_dir / filename

        # Save uploaded file
        with open(file_path, 'wb') as f:
            contents = await file.read()
            f.write(contents)

        # Process with Gemini
        if is_image:
            image = Image.open(file_path).convert("RGB")
            content = [image, prompt] if prompt else [image]
        else:
            content = [types.Part.from_bytes(
                data=file_path.read_bytes(),
                mime_type="application/pdf",
            )]
            if prompt:
                content.append(prompt)

        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=content,
            config=types.GenerateContentConfig(
                system_instruction="""
                You are an expert at answering medical questions.
                Procedure:
                - Analyze the file, The file may be a medical image, medical report.
                - If the content of the file is irrelevant to medical topics, politely inform the user that you can only answer medical questions.
                - If the content is relevant, provide a concise response to the requested prompt.
                - If the user prompt is unclear or missing, summarize the main points from the file.
                - Ensure the response is clear, accurate, and easy to understand.
                """,)
        )

        summary = response.text

        # Update chat updated_at
        await db.chats.update_one(
            {"_id": chat_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )

        return StreamingResponse(sse_token_stream(summary), media_type='text/plain')
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process media: {str(e)}")

@app.get("/chats")
async def list_chats(current_user: dict = Depends(get_current_user)):
    """
    List all chats for the current user.
    """
    chats = await get_user_chats(str(current_user["_id"]))

    # Format for response
    chat_list = []
    for chat in chats:
        # Get last message timestamp
        db = await get_db()
        last_message = await db.messages.find_one(
            {"chat_id": chat["_id"]},
            sort=[("timestamp", -1)]
        )
        last_activity = last_message["timestamp"] if last_message else chat["created_at"].isoformat()

        chat_list.append({
            "id": chat["_id"],
            "title": chat["title"],
            "last_activity": last_activity
        })

    return {"chats": chat_list}

@app.post("/generate-title")
async def generate_title(request: dict, current_user: dict = Depends(get_current_user)):
    """
    Generate a smart 3-5 word title from the bot's response.
    """
    response_text = request.get("response", "").strip()
    if not response_text:
        raise HTTPException(status_code=400, detail="Response text is required")

    # Use the LLM to generate a concise title
    prompt = f"""Given this text, generate a concise 3-5 word title that summarizes it:

Text: {response_text}

Title (only 3-5 words, no punctuation):"""

    title = model.invoke(prompt).strip()
    # Clean up title - remove quotes, limit to first 3-5 words
    title = title.replace('"', '').replace("'", '')
    words = title.split()[:5]
    title = ' '.join(words)

    return {"title": title}

@app.post("/update-chat-title")
async def update_chat_title_endpoint(request: UpdateChatTitleRequest, current_user: dict = Depends(get_current_user)):
    """
    Save/update the chat title.
    """
    # Verify chat belongs to user
    db = await get_db()
    chat = await db.chats.find_one({"_id": request.chat_id, "user_id": ObjectId(current_user["_id"])})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    await update_chat_title(request.chat_id, request.title)

    return {
        "status": "success",
        "chat_id": request.chat_id,
        "title": request.title
    }

@app.post("/summarize-about-me")
async def summarize_about_me(request: AboutMeRequest, current_user: dict = Depends(get_current_user)):
    """
    Summarize the user's about-me text into bullet points and save to database.
    """
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Use LLM to generate bullet points
    prompt = f"""Summarize the following text into 3-5 concise bullet points:

Text: {text}

Bullet points:"""

    summary = model.invoke(prompt).strip()

    # Save to user document
    db = await get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"about_summary": summary, "about_original": text}}
    )

    return {
        "status": "success",
        "summary": summary
    }

@app.get("/get-about-me")
async def get_about_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the stored about-me summary from database.
    """
    return {
        "original_text": current_user.get("about_original", ""),
        "summary": current_user.get("about_summary", "")
    }

