# api.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_ollama import OllamaLLM
from PIL import Image
from contextlib import asynccontextmanager
import asyncio
import os
from pathlib import Path
import json
from datetime import datetime
import traceback
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv;
import os;

load_dotenv()
# Hardcoded Gemini credentials (edit these values in-code)
client : genai.Client | None = None
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 🌟 Startup Code 🌟 ---
    print("Application Startup: Initializing Gemini Client...")
    
    global client
    try:
        # Initialize the client. It's safe to call Client() here, 
        # as the context manager will handle the shutdown.
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")) 
        print("Gemini client initialized successfully.")
    except Exception as e:
        # Handle cases where the client can't be initialized (e.g., missing API key)
        print(f"ERROR: Could not initialize Gemini client: {e}")
        # In a real app, you might want to raise an exception here to halt startup.
        
    # Yield control to the application to handle requests
    yield

    # --- 🛑 Shutdown Code (Executed when Ctrl+C is pressed) 🛑 ---
    print("\nApplication Shutdown: Closing Gemini Client...") 

    if client:
        try:
            # The client's .close() method should be called for a clean shutdown.
            # It's a synchronous call, so no 'await' is needed.
            client.close()
            print("Gemini client connection closed gracefully.")
        except Exception as e:
            print(f"Warning: Failed to close Gemini client cleanly: {e}")
    else:
        print("Gemini client was not initialized, skipping close.")
    
    print("All cleanup complete. Application is shutting down.")

app = FastAPI(title="Digital Doctor API", version="1.1.0",lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later, e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Ollama model once
model = OllamaLLM(model="gemma3:1b")

# APP_DATA directory setup
APP_DATA_DIR = Path("APP_DATA")
APP_DATA_DIR.mkdir(exist_ok=True)

class QueryRequest(BaseModel):
    query: str
    chat_id: str

class MessageData(BaseModel):
    chat_id: str
    sender: str
    text: str
    media: str | None = None
    timestamp: str

# @app.post("/ask")
# async def ask_doctor(request: QueryRequest):
#     query = request.query.strip()
#     chat_id = request.chat_id
    
#     if not query:
#         raise HTTPException(status_code=400, detail="Query cannot be empty.")
#     if not chat_id:
#         raise HTTPException(status_code=400, detail="Chat ID is required.")

#     # Create chat-specific directory if it doesn't exist
#     chat_dir = APP_DATA_DIR / chat_id
#     chat_dir.mkdir(exist_ok=True)

#     review = retriver.invoke(query)
#     context = review[0].page_content if review else "No relevant context found."

#     prompt = f"""
# You are an expert medical assistant.
# Consider this context:
# '
# {context}
# '
# Now answer the user's query in a clear, concise, and helpful way:
# {query}
# """
#     prompt2 = f"""
# You are a friendly medical query assistant. Respond to the users queries with the right response.
# Guidelines while responding:

# - If the question seems to critical. Recommend to consult a doctor right away.
# - If the question is from another domain. Clearly state that you answer medical questions only.

# Now answer the user's query in a clear, concise, and helpful way:
# {query}
# """

#     async def stream_response():
#         """Properly stream Ollama output chunk by chunk."""
#         try:
#             for chunk in model.stream(prompt2):
#                 # 🧩 FIX: OllamaLLM chunks can be str or have .text property
#                 text = getattr(chunk, "text", None)
#                 if text:
#                     yield text
#                 elif isinstance(chunk, str):
#                     yield chunk
#                 await asyncio.sleep(0.01)
#         except Exception as e:
#             yield f"\n[ERROR]: {str(e)}"

#     return StreamingResponse(stream_response(), media_type="text/plain")

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
def stream_sse(request: QueryRequest):
    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[request.query.strip()],
    config=types.GenerateContentConfig(
        system_instruction="""
        You are a medical expert. Your task is to answer medical questions. 
        Guidelines:
        - If the question seems too critical, recommend consulting a doctor right away.
        - If the question is from another domain, clearly state that you answer medical questions only.
        - Return the answer in well structured markdown format use numbered lists, bullet points and bold font whenever necessary.
        - Keep the answer concise and to the point, within 200 words.
        """,)
)
    huge_markdown_output = response.text
    return StreamingResponse(sse_token_stream(huge_markdown_output),
                             media_type="text/plain")



@app.post("/save-message")
async def save_message(message: MessageData):
    """
    Save message metadata to a JSON file
    """
    chat_id = message.chat_id
    
    if not chat_id:
        raise HTTPException(status_code=400, detail="Chat ID is required.")
    
    try:
        # Create chat-specific directory if it doesn't exist
        chat_dir = APP_DATA_DIR / chat_id
        chat_dir.mkdir(exist_ok=True)
        
        # Load existing messages or create new list
        messages_file = chat_dir / "messages.json"
        
        if messages_file.exists():
            with open(messages_file, "r") as f:
                messages = json.load(f)
        else:
            messages = []
        
        # Add new message (include media if present)
        msg_obj = {
            "sender": message.sender,
            "text": message.text,
            "timestamp": message.timestamp
        }
        if getattr(message, 'media', None):
            msg_obj['media'] = message.media
        messages.append(msg_obj)
        
        # Save updated messages
        with open(messages_file, "w") as f:
            json.dump(messages, f, indent=2)
        
        return {
            "status": "success",
            "message": "Message saved successfully",
            "chat_id": chat_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save message: {str(e)}")


@app.get("/chat-data/{chat_id}")
async def get_chat_data(chat_id: str):
    """
    Retrieve all messages and media files for a specific chat
    """
    if not chat_id:
        raise HTTPException(status_code=400, detail="Chat ID is required.")
    
    try:
        chat_dir = APP_DATA_DIR / chat_id
        
        if not chat_dir.exists():
            return {
                "messages": [],
                "media_files": []
            }
        
        # Load messages
        messages = []
        messages_file = chat_dir / "messages.json"
        if messages_file.exists():
            with open(messages_file, "r") as f:
                messages = json.load(f)
        
        # Get media files
        media_files = []
        media_dir = chat_dir / "media"
        if media_dir.exists():
            media_files = [f.name for f in media_dir.iterdir() if f.is_file()]
        
        return {
            "messages": messages,
            "media_files": media_files,
            "chat_id": chat_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chat data: {str(e)}")


@app.get('/media/{chat_id}/{filename}')
async def serve_media(chat_id: str, filename: str):
    """Serve media file for a given chat. Returns FileResponse."""
    try:
        chat_dir = APP_DATA_DIR / chat_id
        media_path = chat_dir / 'media' / filename
        if not media_path.exists():
            raise HTTPException(status_code=404, detail='File not found')
        from fastapi.responses import FileResponse
        return FileResponse(path=str(media_path), filename=filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to serve media: {str(e)}")


@app.post('/process-image')
async def process_image(chat_id: str = Form(...), file: UploadFile = File(...), prompt: str = Form("")):
    """Process an uploaded media file, extract text (PDF or image), summarize via the LLM and stream the summary.

    Accepts multipart/form-data with fields:
    - chat_id (form)
    - file (upload)
    - prompt (form, optional)
    """
    if not chat_id:
        raise HTTPException(status_code=400, detail='Chat ID is required')

    # Restrict allowed file types
    filename = file.filename or "uploaded"
    lower = filename.lower()
    allowed_ext = ('.pdf', '.png', '.jpg', '.jpeg')
    if not lower.endswith(allowed_ext):
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_ext)}")

    is_image = lower.endswith(('.png', '.jpg', '.jpeg'))

    try:
        chat_dir = APP_DATA_DIR / chat_id
        chat_dir.mkdir(exist_ok=True)
        media_dir = chat_dir / 'media'
        media_dir.mkdir(exist_ok=True)
        file_path = media_dir / filename

        # Save uploaded file
        with open(file_path, 'wb') as f:
            contents = await file.read()
            f.write(contents)

        #10th December 
        # adding gemini multi modal input for pdf and jpeg.
        def get_response(file_path):
            if is_image:
                # Open image and convert to RGB
                image = Image.open(file_path).convert("RGB")
            else :
                file = Path(file_path)

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(
                        data=file.read_bytes(),
                        mime_type="application/pdf" if file.suffix.lower() == ".pdf" else "image/jpeg",
                    ) if not is_image else image,
                    prompt
                ],
                config=types.GenerateContentConfig(
                    system_instruction="""
                    You are an expert at answering medical questions based on the content of the provided file.
                    Procedure:
                    - Analyze the content of the file thoroughly.
                    - If the content of the file is irrelevant to medical topics, politely inform the user that you can only answer medical questions.
                    - If the content is relevant, provide a concise response to the requested prompt.
                    - If the user prompt is unclear or missing, summarize the main points from the file.
                    - Ensure the response is clear, accurate, and easy to understand.
                    """,)
                )
            return response.text

        # Stream summary from the LLM
        async def stream_response():
            try:
                for chunk in model.stream(summarization_prompt):
                    text = getattr(chunk, 'text', None)
                    if text:
                        yield text
                    elif isinstance(chunk, str):
                        yield chunk
                    await asyncio.sleep(0.01)
            except Exception as e:
                yield f"\n[ERROR]: {str(e)}"

        return StreamingResponse(sse_token_stream(get_response(file_path)), media_type='text/plain')
    except HTTPException:
        raise
    except Exception as e:
        # Write full traceback to APP_DATA error log for debugging
        try:
            log_file = APP_DATA_DIR / 'error.log'
            with open(log_file, 'a', encoding='utf-8') as lf:
                lf.write(f"[{datetime.now().isoformat()}] process-image error:\n")
                traceback.print_exc(file=lf)
                lf.write("\n\n")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to process media: {str(e)}")


@app.get("/chats")
async def list_chats():
    """
    List all existing chat IDs (directories) under APP_DATA with basic metadata.
    """
    try:
        if not APP_DATA_DIR.exists():
            return {"chats": []}

        chats = []
        for entry in APP_DATA_DIR.iterdir():
            if entry.is_dir():
                # read messages.json to get a timestamp or use dir mtime
                messages_file = entry / "messages.json"
                last_message_time = None
                if messages_file.exists():
                    try:
                        with open(messages_file, "r") as f:
                            msgs = json.load(f)
                        if msgs:
                            # use timestamp of last message if present
                            last_message_time = msgs[-1].get("timestamp")
                    except Exception:
                        last_message_time = None

                if not last_message_time:
                    # fallback to directory modified time
                    last_message_time = datetime.fromtimestamp(entry.stat().st_mtime).isoformat()

                # Try to read title from metadata.json
                title = entry.name  # default to chat_id
                metadata_file = entry / "metadata.json"
                if metadata_file.exists():
                    try:
                        with open(metadata_file, "r") as f:
                            metadata = json.load(f)
                            if metadata.get("title"):
                                title = metadata["title"]
                    except Exception:
                        pass

                chats.append({
                    "id": entry.name,
                    "title": title,
                    "last_activity": last_message_time
                })

        # sort by last_activity desc
        chats.sort(key=lambda c: c.get("last_activity", ""), reverse=True)
        return {"chats": chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list chats: {str(e)}")



@app.post("/generate-title")
async def generate_title(request: dict):
    """
    Generate a smart 3-5 word title from the bot's response.
    """
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate title: {str(e)}")


class AboutMeRequest(BaseModel):
    text: str


class UpdateChatTitleRequest(BaseModel):
    chat_id: str
    title: str


@app.post("/summarize-about-me")
async def summarize_about_me(request: AboutMeRequest):
    """
    Summarize the user's about-me text into bullet points and save to file.
    """
    try:
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")

        # Use LLM to generate bullet points
        prompt = f"""Summarize the following text into 3-5 concise bullet points:

Text: {text}

Bullet points:"""

        summary = model.invoke(prompt).strip()

        # Save to about_me.json in APP_DATA
        about_me_file = APP_DATA_DIR / "about_me.json"
        about_me_data = {
            "original_text": text,
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        }

        with open(about_me_file, "w") as f:
            json.dump(about_me_data, f, indent=2)

        return {
            "status": "success",
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to summarize: {str(e)}")


@app.get("/get-about-me")
async def get_about_me():
    """
    Retrieve the stored about-me summary from file.
    """
    try:
        about_me_file = APP_DATA_DIR / "about_me.json"
        if not about_me_file.exists():
            return {
                "original_text": "",
                "summary": ""
            }

        with open(about_me_file, "r") as f:
            data = json.load(f)

        return {
            "original_text": data.get("original_text", ""),
            "summary": data.get("summary", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve about-me: {str(e)}")


@app.post("/update-chat-title")
async def update_chat_title(request: UpdateChatTitleRequest):
    """
    Save/update the chat title to a metadata file.
    """
    try:
        chat_id = request.chat_id.strip()
        title = request.title.strip()
        
        if not chat_id:
            raise HTTPException(status_code=400, detail="Chat ID is required")
        if not title:
            raise HTTPException(status_code=400, detail="Title is required")

        # Create chat directory if it doesn't exist
        chat_dir = APP_DATA_DIR / chat_id
        chat_dir.mkdir(exist_ok=True)

        # Save title to metadata file
        metadata_file = chat_dir / "metadata.json"
        metadata = {
            "chat_id": chat_id,
            "title": title,
            "updated_at": datetime.now().isoformat()
        }

        with open(metadata_file, "w") as f:
            json.dump(metadata, f, indent=2)

        return {
            "status": "success",
            "chat_id": chat_id,
            "title": title
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update chat title: {str(e)}")

