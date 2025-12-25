# Digi-Doc System Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph Client ["🖥️ Frontend Layer - React/TypeScript"]
        App["App.tsx<br/>Main Component"]
        Auth["AuthPage<br/>User Authentication"]
        Chat["Chat Interface<br/>Message Display & Input"]
        Dashboard["Dashboard<br/>Profile & Stats"]
        Sidebar["Sidebar<br/>Chat Navigation"]
        Media["UploadedMediaDialog<br/>Media Gallery"]
        UI["UI Components<br/>Radix UI Elements"]
    end

    subgraph State ["⚙️ State Management"]
        Contexts["React Contexts<br/>User & Chat State"]
    end

    subgraph Build ["🔨 Build & Config"]
        Vite["Vite<br/>Dev Server & Build"]
        Tailwind["Tailwind CSS<br/>Styling"]
        TypeScript["TypeScript<br/>Type Safety"]
    end

    subgraph API ["🌐 API Layer - FastAPI"]
        Server["FastAPI Server<br/>REST API"]
        CORS["CORS Middleware<br/>Cross-Origin Support"]
        Lifespan["App Lifespan<br/>Startup/Shutdown"]
    end

    subgraph Routes ["📡 API Routes"]
        AuthRouter["Auth Router<br/>Login/Register/JWT"]
        ChatRouter["Chat Router<br/>Message Processing"]
        MediaRouter["Media Router<br/>File Upload/Serve"]
    end

    subgraph Services ["🤖 Service Layer"]
        LLM["LLM Service<br/>Google Gemini<br/>Ollama Integration"]
        ChatService["Chat Service<br/>Context Management<br/>Title Generation"]
        MediaService["Media Service<br/>File Handling<br/>Validation"]
    end

    subgraph Core ["🔒 Core Module"]
        Config["Config<br/>Environment Variables<br/>API Keys"]
        Security["Security<br/>JWT Generation<br/>Password Hashing"]
    end

    subgraph Database ["💾 Data Layer"]
        MongoDB["MongoDB<br/>NoSQL Database"]
        Motor["Motor Driver<br/>Async MongoDB"]
    end

    subgraph CRUD ["📝 CRUD Operations"]
        UserCRUD["User CRUD<br/>Authentication"]
        ChatCRUD["Chat CRUD<br/>Messages & Metadata"]
        MediaCRUD["Media CRUD<br/>File References"]
    end

    subgraph Storage ["📦 Storage Layer"]
        AppData["APP_DATA/<br/>Chat Sessions<br/>Messages<br/>Metadata"]
        MediaFolder["MEDIA/<br/>Uploaded Files<br/>PDFs, Images"]
    end

    Client -->|HTTP Requests| API
    Auth -->|Login/Register| AuthRouter
    Chat -->|Send/Receive Messages| ChatRouter
    Dashboard -->|Fetch Profile| AuthRouter
    Sidebar -->|List Chats| ChatRouter
    Media -->|Upload/View Files| MediaRouter
    
    App --> Contexts
    App --> Auth
    App --> Chat
    App --> Dashboard
    App --> Sidebar
    App --> Media
    
    Client -->|Styles| Tailwind
    Client -->|TypeScript Check| TypeScript
    Client -->|Dev Server| Vite
    
    API --> CORS
    API --> Lifespan
    API --> Routes
    
    Routes --> AuthRouter
    Routes --> ChatRouter
    Routes --> MediaRouter
    
    AuthRouter --> Security
    ChatRouter --> ChatService
    ChatRouter --> LLM
    MediaRouter --> MediaService
    
    AuthRouter --> CRUD
    ChatRouter --> CRUD
    MediaRouter --> CRUD
    
    CRUD --> Motor
    Motor --> MongoDB
    
    ChatService --> LLM
    ChatService --> CRUD
    
    MediaService --> Storage
    
    Config --> Security
    Config --> LLM
    
    CRUD -->|User Data| Storage
    LLM -->|Process Text| ChatService
    MediaService -->|Store Files| AppData
    MediaService -->|Store Files| MediaFolder

    style Client fill:#e1f5ff,stroke:#01579b,color:#000
    style API fill:#f3e5f5,stroke:#4a148c,color:#000
    style Services fill:#fff3e0,stroke:#e65100,color:#000
    style Database fill:#e8f5e9,stroke:#1b5e20,color:#000
    style Storage fill:#ede7f6,stroke:#311b92,color:#000
    style Core fill:#fce4ec,stroke:#880e4f,color:#000
```

## Component Descriptions

### Frontend Layer
- **App.tsx**: Main application component, routing hub
- **AuthPage**: User login and registration interface
- **Chat Interface**: Real-time message display and input with token streaming
- **Dashboard**: User profile overview and health summaries
- **Sidebar**: Navigation between chat sessions
- **UploadedMediaDialog**: Gallery view of uploaded medical documents
- **UI Components**: Reusable Radix UI-based components

### Backend API
- **FastAPI Server**: RESTful API serving all client requests
- **CORS Middleware**: Handles cross-origin requests
- **Lifespan Management**: Initializes and cleans up resources (Gemini client, MongoDB)

### API Routes
- **Auth Router**: User authentication, JWT token generation, registration
- **Chat Router**: Message creation, retrieval, context management, AI title generation
- **Media Router**: File uploads, validation, secure file serving

### Service Layer
- **LLM Service**: Integration with Google Gemini 2.5 Flash and Ollama (Gemma)
- **Chat Service**: Context preservation (last 10 messages), response streaming
- **Media Service**: File handling, validation (PDF, PNG, JPG), organization

### Core Modules
- **Config**: Environment variable management, API key storage
- **Security**: JWT token generation/validation, password hashing

### Data Layer
- **MongoDB**: NoSQL database for scalable data storage
- **Motor**: Async MongoDB driver for non-blocking operations
- **CRUD Operations**: Abstracted database operations for users, chats, and media

### Storage Layer
- **APP_DATA/**: Chat sessions with messages and metadata (JSON files)
- **MEDIA/**: Uploaded medical documents organized by chat session

## Data Flow

1. **User Authentication**: Frontend sends credentials → Auth Router → Security module → User CRUD → MongoDB
2. **Chat Message**: Frontend sends message → Chat Router → LLM Service → Gemini API → Streaming response
3. **Media Upload**: Frontend uploads file → Media Router → Media Service → FILE_STORAGE
4. **Chat Context**: Chat Router retrieves last 10 messages from MongoDB → Included in LLM request

## Key Features
- **Real-time Streaming**: Token-by-token response delivery via SSE
- **Secure Authentication**: JWT-based session management
- **Asynchronous Operations**: Motor driver enables non-blocking database calls
- **Modular Architecture**: Separation of concerns across routers, services, and CRUD
- **Media Management**: Centralized gallery with authenticated access
