import { useEffect, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { MessageSquare } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  media?: string;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show welcome screen if no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-[#EAF4F9]">
        <div className="text-center space-y-6 max-w-md px-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20  bg-opacity-10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-[#4BA3C3]" />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h2 className="text-[#2A9D8F]">Welcome to Digi-Doc</h2>
            <p className="text-gray-600">
              Your AI-powered medical assistant. Start a conversation to get health advice,
              discuss symptoms, or ask medical questions.
            </p>
          </div>

          {/* Suggestions */}
          <div className="grid grid-cols-1 gap-3 pt-4">
            <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left border border-gray-100 cursor-pointer">
              <p className="text-sm text-gray-700">💊 Ask about medications</p>
            </button>
            <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left border border-gray-100 cursor-pointer">
              <p className="text-sm text-gray-700">🩺 Discuss symptoms</p>
            </button>
            <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left border border-gray-100 cursor-pointer">
              <p className="text-sm text-gray-700">📋 Review lab results</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show messages
  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-white to-[#EAF4F9]">
      <ScrollArea className="h-full">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-xl shadow-sm ${
                  message.sender === "user"
                    ? "bg-[#EAF4F9] text-gray-800"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                {/* If message has media, show filename on top */}
                {message.media && (
                  <div className="mb-2">
                    <a
                      href={`http://localhost:8000/media/${(message.id.slice(0, message.id.lastIndexOf('_')) || '')}/${message.media}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#4BA3C3] underline break-words"
                    >
                      {message.media}
                    </a>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
