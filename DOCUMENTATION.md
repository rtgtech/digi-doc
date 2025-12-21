# Digi-Doc Documentation

## Project Overview
Digi-Doc is an AI-powered medical assistant designed to help users with medical queries. It leverages Large Language Models (LLMs) like Llama 3.2 (via Ollama) and Google Gemini to provide intelligent responses. The application also supports media uploads (PDFs and Images) for OCR (Optical Character Recognition) and summarization of medical reports.

## Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.10+
- **AI/LLM**:
    - [LangChain](https://python.langchain.com/) (Orchestration)
    - [Ollama](https://ollama.com/) (Local LLM: `llama3.2:3b`)
    - [Google Gemini](https://ai.google.dev/) (Cloud LLM: `gemini-2.5-flash`)
- **Media Processing**:
    - [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/) for PDF text extraction.
    - [Pillow (PIL)](https://python-pillow.org/) & [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) for image text extraction.
- **Data Storage**: Local JSON files in `APP_DATA/` directory.

### Frontend
- **Framework**: [React](https://react.dev/) (v19)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/) (Icons)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

1.  **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
2.  **Node.js 18+**: [Download Node.js](https://nodejs.org/)
3.  **Ollama**: [Download Ollama](https://ollama.com/)
    - Pull the required model: `ollama pull llama3.2:3b`
4.  **Tesseract OCR**:
    - **Windows**: [Download Installer](https://github.com/UB-Mannheim/tesseract/wiki) (Add to PATH)
    - **Linux**: `sudo apt-get install tesseract-ocr`
    - **macOS**: `brew install tesseract`

---

## Installation & Setup

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```

3.  Activate the virtual environment:
    - **Windows**: `venv\Scripts\activate`
    - **macOS/Linux**: `source venv/bin/activate`

4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5.  Set up environment variables:
    - Create a `.env` file in the `backend/` directory.
    - Add your Google Gemini API key:
      ```env
      GEMINI_API_KEY=your_api_key_here
      ```

6.  Run the server:
    ```bash
    uvicorn digidoc_app:app --reload
    ```
    The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port shown in the terminal).

---

## Project Structure

```
Digi-Doc/
├── backend/
│   ├── APP_DATA/           # Stores chat history, media, and metadata (Local DB)
│   ├── digidoc_app.py      # Main FastAPI application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables (API Keys)
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI components (ChatInput, MessageList, etc.)
│   │   ├── App.tsx         # Main React component
│   │   └── main.tsx        # Entry point
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
└── DOCUMENTATION.md        # This file
```

---

## Key Features & Usage

### 1. Medical Chat
- **Ask a Question**: Type your medical query in the chat input.
- **Streaming Responses**: The bot streams responses token-by-token for a real-time experience.
- **AI Models**: Uses Google Gemini for general queries (`/ask_a`) and Ollama for local processing.

### 2. Media Analysis
- **Upload**: Click the attachment icon to upload a PDF report or a medical image (X-Ray, prescription, etc.).
- **Processing**:
    - **PDFs**: Text is extracted using PyMuPDF.
    - **Images**: Text is extracted using Tesseract OCR.
- **Summarization**: The extracted text is sent to the LLM (Ollama) to generate a patient-friendly summary.

### 3. Chat History
- **Sessions**: Previous chat sessions are saved and listed in the sidebar.
- **Persistence**: Messages and uploaded files are stored locally in `backend/APP_DATA/`.

### 4. User Profile
- **About Me**: Users can save their medical history or personal details, which are summarized and stored for context.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/ask_a` | Streams a response from Google Gemini for a medical query. |
| `POST` | `/process-image` | Uploads a file, extracts text (OCR/PDF), and streams a summary. |
| `POST` | `/save-message` | Saves a user or bot message to the local JSON storage. |
| `GET` | `/chats` | Lists all chat sessions with metadata. |
| `GET` | `/chat-data/{id}` | Retrieves messages and media for a specific chat ID. |
| `GET` | `/media/{id}/{file}` | Serves uploaded media files. |

---

## Troubleshooting

- **Ollama Connection Error**: Ensure Ollama is running (`ollama serve`) and the model `llama3.2:3b` is pulled.
- **Tesseract Not Found**: Ensure Tesseract is installed and added to your system's PATH.
- **Gemini API Error**: Check if `GEMINI_API_KEY` is correctly set in `backend/.env`.
- **CORS Issues**: If the frontend cannot talk to the backend, ensure `CORSMiddleware` in `digidoc_app.py` allows the frontend origin.

---

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
