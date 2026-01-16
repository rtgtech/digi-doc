# 🏥 Digi-Doc: Your Intelligent Medical AI Assistant

**Digi-Doc** is a cutting-edge, full-stack medical AI platform designed to transform how users interact with medical information and manage their health documents. Combining the power of **Google Gemini** with a sleek, simple interface, Digi-Doc provides instant medical insights while keeping your data secure and organized.

---

# Architecture

> [Architecture](ARCHITECTURE.md)

> [Simplified Architecture](SIMPLE_ARCHITECTURE.md)



## 🚀 Key Capabilities

- **💬 Intelligent Medical Chat**: Get accurate, context-aware answers to medical queries in real-time.
- **📄 Document Analysis (PDF)**: Upload medical reports, prescriptions, or X-rays. Digi-Doc extracts text and summarizes complex medical findings.
- **🔐 Secure Medical Profiles**: Register and login to maintain a private vault of your health history.
- **📊 Personalized Summaries**: Our AI summarizes your medical profile into actionable bullet points for quick reference.
- **📁 Automated Organization**: Conversations and media are logically grouped by session, making them easy to retrieve.

---

## ✨ Appearance & UX

Digi-Doc is built with a **Modern Aesthetic** to ensure a professional and simple user experience:

- **⚡ Real-time Feedback**: Token-by-token response streaming for a responsive, human-like chat feel.
- **🌓 Adaptive Design**: A professional color palette (Soft White/Deep Blue) optimized for clarity and readability.
- **Non-Overwhelming Look**: Clean, simple design with minimal distractions.

---

## 🛠️ Core Features

### 1. Advanced Chat Experience
- **Context Preservation**: The AI remembers the last 10 messages for coherent multi-turn conversations.
- **Streaming SSE**: Instant token-by-token feedback.
- **Smart Titles**: AI-generated chat titles (3-5 words) based on the first interaction.

### 2. Media Management
- **Universal Uploader**: Supports PDF, PNG, and JPG.
- **Centralized Gallery**: View all your uploaded medical documents across all previous chats.
- **Authenticated Serve**: Secure media serving logic preventing unauthorized access.

### 3. Integrated Dashboard
- **Profile Overview**: AI-summarized health background.
- **Activity Stats**: (Coming Soon) Track your medical query history and health trends.

---

## 🧩 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI.
- **Backend**: FastAPI, Python 3.10+, MongoDB (Motor).
- **AI/LLM**: Google Gemini 2.5 Flash, Ollama (Gemma 3:1B).
- **Authentication**: JWT-based secure sessions.

---

## 📦 Quick Start

For full installation and setup instructions, please refer to the detailed **DOCUMENTATION.md**.

```bash
# Clone the repository
git clone https://github.com/rtgtech/digi-doc.git

# Set up backend
cd backend
python -m venv venv
pip install -r requirements.txt
# Configure .env with GEMINI_API_KEY and MONGODB_URL

# Set up frontend
cd ../frontend
npm install
npm run dev
```

---

## 📄 Documentation

- **DOCUMENTATION.md**: User guide, setup, and general overview.
- **IMPLEMENTATION_SUMMARY.md**: Deep technical architecture and API specifications.

---

> IMPORTANT

> **Medical Disclaimer**: Digi-Doc is an AI assistant and should **not** be used as a replacement for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
