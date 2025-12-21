import { useState, useEffect } from "react";
import type { Message } from "./components/MessageList";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";
import { ProfileDialog } from "./components/ProfileDialog";
import { Sidebar } from "./components/Sidebar";
import type { ChatSession } from "./components/Sidebar";
import { UploadedMediaDialog } from "./components/UploadedMediaDialog";

function generateChatId(): string {
  return `chat_${Date.now()}`;
}

export default function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [chatCounter, setChatCounter] = useState(1);
  const [titleGeneratedForChat, setTitleGeneratedForChat] = useState<string | null>(null);

  // Initialize chat ID on app start
  useEffect(() => {
    const initialChatId = generateChatId();
    setCurrentChatId(initialChatId);
  }, []);

  // Fetch existing chats from backend on startup
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('http://localhost:8000/chats');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.chats) {
          const sessions: ChatSession[] = data.chats.map((c: any, idx: number) => ({
            id: c.id,
            title: c.title || c.id,
            timestamp: c.last_activity ? new Date(c.last_activity) : new Date(),
          }));
          setChatHistory(sessions);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
      }
    };

    fetchChats();
  }, []);

  const handleSendMessage = async (message: string, file?: File | null) => {
    // If this chat id is not yet in history, add it now (first message in new chat)
    if (currentChatId && !chatHistory.find((c) => c.id === currentChatId)) {
      const newSession: ChatSession = {
        id: currentChatId,
        title: `Chat #${chatCounter}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [newSession, ...prev]);
      setChatCounter((prev) => prev + 1);
    }
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };
    // attach media name to message object if present (frontend representation)
    if (file) {
      // @ts-ignore add media property
      (userMessage as any).media = file.name;
    }
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to backend (include media if present)
    try {
      await fetch('http://localhost:8000/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: currentChatId,
          sender: "user",
          text: message,
          media: file ? file.name : undefined,
          timestamp: userMessage.timestamp.toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    // Create initial bot message placeholder
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);

    // If a file is attached, call process-image endpoint which streams a response
    if (file) {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('chat_id', currentChatId);
        form.append('prompt', message);

        const response = await fetch('http://localhost:8000/process-image', {
          method: 'POST',
          body: form,
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        let accumulatedText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg))
          );
        }

        // Save bot message after streaming (with media if present)
        try {
          await fetch('http://localhost:8000/save-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: currentChatId,
              sender: 'bot',
              text: accumulatedText,
              media: file ? file.name : undefined,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error('Error saving bot message:', err);
        }

        // Generate title for this chat if not already done
        if (titleGeneratedForChat !== currentChatId) {
          try {
            const titleRes = await fetch('http://localhost:8000/generate-title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ response: accumulatedText }),
            });
            if (titleRes.ok) {
              const titleData = await titleRes.json();
              const newTitle = titleData.title || `Chat #${chatCounter}`;
              setChatHistory((prev) =>
                prev.map((chat) =>
                  chat.id === currentChatId ? { ...chat, title: newTitle } : chat
                )
              );
              setTitleGeneratedForChat(currentChatId);

              // Persist title to backend
              try {
                await fetch('http://localhost:8000/update-chat-title', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: currentChatId, title: newTitle }),
                });
              } catch (err) {
                console.error('Error saving chat title:', err);
              }
            }
          } catch (err) {
            console.error('Error generating title:', err);
          }
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: 'Sorry, there was an error processing the image.' } : msg
          )
        );
      }
      return;
    }

    // No file attached: use the regular /ask streaming endpoint
    try {
      const response = await fetch('http://localhost:8000/ask_a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message, chat_id: currentChatId }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        accumulatedText += chunk;
        setMessages((prev) => prev.map((msg) => (msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg)));
      }

      // Save bot message to backend after streaming is complete
      try {
        await fetch('http://localhost:8000/save-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: currentChatId, sender: 'bot', text: accumulatedText, timestamp: new Date().toISOString() }),
        });
      } catch (error) {
        console.error('Error saving bot message:', error);
      }

      // Generate title for this chat if not already done
      if (titleGeneratedForChat !== currentChatId) {
        try {
          const titleRes = await fetch('http://localhost:8000/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response: accumulatedText }),
          });
          if (titleRes.ok) {
            const titleData = await titleRes.json();
            const newTitle = titleData.title || `Chat #${chatCounter}`;
            setChatHistory((prev) =>
              prev.map((chat) =>
                chat.id === currentChatId ? { ...chat, title: newTitle } : chat
              )
            );
            setTitleGeneratedForChat(currentChatId);

            // Persist title to backend
            try {
              await fetch('http://localhost:8000/update-chat-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: currentChatId, title: newTitle }),
              });
            } catch (err) {
              console.error('Error saving chat title:', err);
            }
          }
        } catch (err) {
          console.error('Error generating title:', err);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => prev.map(
        (msg) => (
          msg.id === botMessageId ? { ...msg, text: 'Error generating a response, check your internet connection. Alternatively try contacting Rumaan' } : msg
        )
      ));
    }
  };

  // Note: file uploads are handled when sending a message with a file (process-image)

  const handleNewChat = () => {
    // Do not save current chat here. Create a new chat id and clear messages.
    const newChatId = generateChatId();
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const handleChatSelect = (chatId: string) => {
    // Load messages for selected chat from backend
    const loadChat = async (id: string) => {
      setCurrentChatId(id);
      try {
        const res = await fetch(`http://localhost:8000/chat-data/${id}`);
        if (!res.ok) {
          setMessages([]);
          return;
        }
        const data = await res.json();
        const msgs = (data.messages || []).map((m: any, idx: number) => ({
          id: `${id}_${idx}`,
          text: m.text,
          sender: m.sender,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          media: m.media,
        }));
        setMessages(msgs);
      } catch (err) {
        console.error('Error loading chat messages:', err);
        setMessages([]);
      }
    };

    loadChat(chatId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFC]">
      {/* Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        onProfileClick={() => setIsProfileOpen(true)}
        onNewChat={handleNewChat}
        onMediaClick={() => setIsMediaOpen(true)}
        chatHistory={chatHistory}
        onChatSelect={handleChatSelect}
        currentChatId={currentChatId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Message List */}
        <MessageList messages={messages} />

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          currentChatId={currentChatId}
        />
      </div>

      {/* Profile Dialog */}
      <ProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />

      {/* Uploaded Media Dialog */}
      <UploadedMediaDialog
        open={isMediaOpen}
        onOpenChange={setIsMediaOpen}
        currentChatId={currentChatId}
      />
    </div>
  );
}
