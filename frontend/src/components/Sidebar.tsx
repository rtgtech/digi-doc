import { motion } from "motion/react";
import { Stethoscope, Plus, Image, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../contexts/AuthContext";

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onProfileClick: () => void;
  onNewChat: () => void;
  onMediaClick: () => void;
  chatHistory: ChatSession[];
  onChatSelect: (chatId: string) => void;
  currentChatId?: string;
}

export function Sidebar({
  isExpanded,
  onToggle,
  onProfileClick,
  onNewChat,
  onMediaClick,
  chatHistory,
  onChatSelect,
  currentChatId,
}: SidebarProps) {
  const { user } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isExpanded ? "280px" : "80px",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col relative"
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-[#4BA3C3] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#2A9D8F] transition-colors cursor-pointer"
        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isExpanded ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
      </button>

      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 flex items-center justify-center   h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4BA3C3] rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[#2A9D8F]"
              >
                Digital Docter
              </motion.span>
            )}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          {isExpanded ? (
            <>
              <Button
                onClick={onNewChat}
                variant="default"
                className="w-full justify-start gap-3 bg-[#4BA3C3] hover:bg-[#2A9D8F] rounded-xl cursor-pointer"
                title="Start a New Chat"
              >
                <Plus className="w-5 h-5" />
                <span>New Chat</span>
              </Button>
              <Button
                onClick={onMediaClick}
                variant="outline"
                className="w-full justify-start gap-3 border-gray-300 hover:bg-[#F9FBFC] rounded-xl cursor-pointer"
                title="View Uploaded Media"
              >
                <Image className="w-5 h-5" />
                <span>Uploaded Media</span>
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={onNewChat}
                className="w-full h-12 flex items-center justify-center hover:bg-[#F9FBFC] rounded-xl transition-colors cursor-pointer"
                title="Start a New Chat"
              >
                <Plus className="w-5 h-5 text-[#4BA3C3]" />
              </button>
              <button
                onClick={onMediaClick}
                className="w-full h-12 flex items-center justify-center hover:bg-[#F9FBFC] rounded-xl transition-colors cursor-pointer"
                title="View Uploaded Media "
              >
                <Image className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}
        </div>

        {/* Chat History */}
        {isExpanded && (
          <div className="flex-1 overflow-hidden">
            <div className="px-4 py-2">
              <span className="text-gray-500 text-sm">Recent Chats</span>
            </div>
            <ScrollArea className="h-full px-4">
              <div className="space-y-1 pb-4">
                {chatHistory.map((chat) => (
                  <motion.button
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`w-full text-left px-3 py-2 rounded-xl hover:bg-[#F9FBFC] transition-colors text-[#333333] text-sm cursor-pointer ${currentChatId === chat.id ? 'bg-[#F9FBFC] border-l-2 border-[#4BA3C3]' : ''
                      }`}
                  >
                    {chat.title}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* User Profile */}
        <button
          onClick={onProfileClick}
          className={`p-4 flex items-center gap-3 hover:bg-[#F9FBFC] transition-colors cursor-pointer ${isExpanded ? "justify-start" : "justify-center"
            }`}
          title="View Profile"
        >
          <Avatar className="w-10 h-10 border-2 border-[#4BA3C3]">
            <AvatarFallback className="bg-[#4BA3C3] text-white">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-start"
            >
              <span className="text-sm text-[#333333]">{user?.name || 'User'}</span>
              <span className="text-xs text-gray-500">View Profile</span>
            </motion.div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
