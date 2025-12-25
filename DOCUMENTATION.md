# Digi-Doc Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

---

## Project Overview

**Digi-Doc** is an AI-powered medical chatbot assistant designed to help users with medical queries, report analysis, and health document management. It features a secure user system, cloud-based LLM analysis, and local persistence for sensitive medical data.

### Key Capabilities
- 💬 **Medical AI Chat**: Context-aware conversations using **Google Gemini 2.5 Flash**.
- 🔐 **Secure Access**: JWT-based authentication for private medical history.
- 📄 **Report Analysis**: Extract and summarize data from PDFs and medical images (OCR).
- 📊 **Health Dashboard**: Centralized view of your medical data and activity.
- 💾 **Persistent History**: All conversations and media are stored in a secure MongoDB database.

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/) |
| **Language** | Python 3.10+ |
| **Database** | [MongoDB](https://www.mongodb.com/) (Motor/Async) |
| **Cloud LLM** | [Google Gemini](https://ai.google.dev/) (2.5 Flash Lite) |
| **Local LLM** | [Ollama](https://ollama.com/) (Gemma 3:1B) |
| **Auth** | JWT (PyJWT) + Passlib (bcrypt) |
| **Media** | PyMuPDF (fitz) + Pillow (PIL) |

### Frontend
| Component | Technology |
|-----------|-----------|
| **Framework** | [React](https://react.dev/) (v19) + [Vite](https://vitejs.dev/) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |

---

## Quick Start

### Prerequisites
1. **Python 3.10+**
2. **Node.js 18+**
3. **MongoDB** (Running on `localhost:27017` or cloud URI)
4. **Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_key_here
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=your_random_secret_string
```

Start the API server:
```bash
uvicorn digidoc_app:app --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Project Structure

```
Digi-Doc/
├── backend/
│   ├── app/                # Modular application core
│   │   ├── core/           # Security, Config, LLM Init
│   │   ├── db/             # MongoDB Client
│   │   ├── routers/        # API Endpoints (Auth, Chat, Media)
│   │   └── schemas/        # Request/Response validation
│   ├── MEDIA/              # Local storage for uploaded documents
│   ├── digidoc_app.py      # Main entry point (FastAPI)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (Auth, Chat, Dashboard)
│   │   ├── contexts/       # Global State (AuthContext)
│   │   ├── assets/         # Static images/CSS
│   │   └── App.tsx         # Root Application Logic
│   └── tailwind.config.js
├── ChangeLog.md            # History of changes
├── DOCUMENTATION.md        # This file
└── IMPLEMENTATION_SUMMARY.md # Deep technical details
```

---

## Core Features

### 1. Secure Authentication
Users must register and login to access the chatbot. This ensures that medical history and uploaded files remain private.

### 2. Intelligent Medical Assistant
- **Streamed Conversations**: Responses appear word-by-word for a natural feel.
- **Contextual Memory**: The bot "remembers" the last 10 messages in a session.
- **Smart Titles**: Chats are automatically named based on the first few sentences of the bot's response.

### 3. Medical Document Analysis
- **PDF Uploads**: Upload prescriptions or lab results for analysis.
- **Image OCR**: Upload X-rays or handwritten notes for text extraction and summary.
- **Integrated View**: See all your uploaded media in the Sidebar gallery.

---

## API Reference

### Auth Endpoints
- `POST /register`: Payload: `{name, email, phone_number, about, date_of_birth, password}`
- `POST /login`: Payload: `{email, password}`
- `GET /me`: Returns logged-in user details.

### Chat Endpoints
- `POST /ask_a`: Send `{query, chat_id, history}` for a streaming response.
- `GET /chats`: List all chat sessions for the user.
- `GET /chat-data/{chat_id}`: Fetch all messages and media for a specific session.
- `POST /generate-title`: Request `{response}` to get a 3-5 word title suggestion.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **MongoDB Connection Failure** | Ensure MongoDB is running locally or check your `MONGODB_URL` in `.env`. |
| **Gemini API Key Error** | Check that `GEMINI_API_KEY` is correctly set in your `.env`. |
| **CORS Errors** | Ensure the frontend URL (`localhost:5173`) matches the `allow_origins` in `digidoc_app.py`. |
| **Media Upload Issues** | Check write permissions for the `backend/MEDIA` directory. |

---

## Contributing

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/CoolFeature`).
3. Commit your changes (`git commit -m 'Add CoolFeature'`).
4. Push to the branch (`git push origin feature/CoolFeature`).
5. Open a Pull Request.
