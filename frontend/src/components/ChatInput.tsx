import { useState, useRef } from "react";
import { Plus, Mic, Send, MessageSquare, X } from "lucide-react";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  onSendMessage?: (message: string, file?: File | null) => void;
  currentChatId?: string;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message, selectedFile);
      setMessage("");
      setSelectedFile(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMicClick = () => {
    // if (!message.trim()) {
    //   setIsRecording(!isRecording);
    // }
  };

  const handleRestoreInput = () => {
    setIsRecording(false);
  };

  return (
    <div className="relative">
      {/* Recording Mode Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            {/* Removed bg-black/10 from classname above 19-12-25*/}
            <div className="flex items-center gap-4">
              {/* Mic with Pulsing Ripple */}
              <motion.button
                onClick={handleMicClick}
                className="relative w-16 h-16 bg-[#4BA3C3] rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Mic className="w-7 h-7 text-white" />
                
                {/* Pulsing Ripple */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#4BA3C3]"
                  animate={{
                    scale: [1, 2, 2],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#4BA3C3]"
                  animate={{
                    scale: [1, 2, 2],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5,
                  }}
                />
              </motion.button>

              {/* Message Icon to Restore Input */}
              <motion.button
                onClick={handleRestoreInput}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-6 h-6 text-[#4BA3C3]" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Bar */}
      <motion.div
        animate={{
          y: isRecording ? 100 : 0,
          opacity: isRecording ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="border-gray-200 p-4"
      >
        {/* Removed border-t and bg-white */}
        <div className={selectedFile ? "max-w-5xl mx-auto" : "max-w-4xl mx-auto"}>
          <div className={`flex items-center gap-3 bg-[#F9FBFC]-ip-box rounded-xl p-3 shadow-md ${selectedFile ? 'pr-4' : ''}`}>
            {/* File Upload/Remove Button */}
            <button
              onClick={selectedFile ? handleRemoveMedia : handleFileClick}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors cursor-pointer"
              title={selectedFile ? "Remove media" : "Upload media"}
            >
              {selectedFile ? (
                <X className="w-5 h-5 text-red-500" />
              ) : (
                <Plus className="w-5 h-5 text-[#4BA3C3]" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />

            {/* Selected file name (if any) */}
            {selectedFile && (
              <div className="flex-shrink-0 max-w-xs md:max-w-sm lg:max-w-md">
                <div className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-md break-words">
                  {selectedFile.name.length > 40 ? (
                    selectedFile.name.match(/.{1,40}/g)?.join('\n')
                  ) : (
                    selectedFile.name
                  )}
                </div>
              </div>
            )}

            {/* Text Input */}
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message…"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
            />

            {/* Mic or Send Button */}
            <button
              onClick={message.trim() ? handleSend : handleMicClick}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#4BA3C3] hover:bg-[#2A9D8F] rounded-lg transition-colors cursor-pointer"
            >
              {message.trim() ? (
                <Send className="w-5 h-5 text-white" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
