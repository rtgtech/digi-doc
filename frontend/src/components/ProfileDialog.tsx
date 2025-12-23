import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Mail, Phone, MapPin, LogOut, Send } from "lucide-react";
import { Separator } from "./ui/separator";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

export function ProfileDialog({ open, onOpenChange, onLogout }: ProfileDialogProps) {
  const { user } = useAuth();
  const [aboutMeText, setAboutMeText] = useState("");
  const [aboutMeSummary, setAboutMeSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch stored about-me on dialog open
  useEffect(() => {
    if (open) {
      fetchAboutMe();
    }
  }, [open]);

  const fetchAboutMe = async () => {
    try {
      const res = await fetch('http://localhost:8000/get-about-me');
      if (res.ok) {
        const data = await res.json();
        setAboutMeText(data.original_text || "");
        setAboutMeSummary(data.summary || "");
      }
    } catch (err) {
      console.error('Error fetching about-me:', err);
    }
  };

  const handleSaveAboutMe = async () => {
    if (!aboutMeText.trim()) {
      alert("Please write something about yourself");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/summarize-about-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aboutMeText }),
      });

      if (res.ok) {
        const data = await res.json();
        setAboutMeSummary(data.summary);
        alert("About me saved successfully!");
      }
    } catch (err) {
      console.error('Error saving about-me:', err);
      alert("Failed to save about me");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle>Profile</DialogTitle>
          <Button
            onClick={handleSaveAboutMe}
            disabled={isLoading}
            className="absolute top-2 right-2 gap-2 bg-[#4BA3C3] hover:bg-[#2A9D8F] h-8 px-3 text-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            About me
          </Button>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {/* Avatar & Name Section */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="w-24 h-24 border-4 border-[#4BA3C3]">
              <AvatarFallback className="bg-[#4BA3C3] text-white text-2xl">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-gray-800">{user?.name || 'User'}</h3>
              <p className="text-sm text-gray-500">Premium User</p>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-[#4BA3C3]" />
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-[#4BA3C3]" />
                <span>{user?.phone_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-[#4BA3C3]" />
                <span>Bangalore, IN</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* About Me Section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">About You</p>
            <div className="flex gap-2">
              <textarea
                value={aboutMeText}
                onChange={(e) => setAboutMeText(e.target.value)}
                placeholder="Tell me about yourself..."
                className="flex-1 h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4BA3C3] resize-none"
              />
              <button
                onClick={handleSaveAboutMe}
                disabled={isLoading}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#4BA3C3] hover:bg-[#2A9D8F] text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* About Me Summary Display */}
          {aboutMeSummary && (
            <div className="space-y-2 bg-[#F9FBFC] p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 uppercase">Your Summary</p>
              <div className="prose prose-sm max-w-none text-sm text-gray-700 whitespace-pre-line">
                {aboutMeSummary}
              </div>
            </div>
          )}

          <Separator />

          {/* Sign Out Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-red-200 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
            onClick={() => {
              onLogout();
              onOpenChange(false);
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
