import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Mail, Phone, MapPin, LogOut } from "lucide-react";
import { Separator } from "./ui/separator";
//import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

export function ProfileDialog({ open, onOpenChange, onLogout }: ProfileDialogProps) {
  const { user } = useAuth();
  //const [aboutMeText, setAboutMeText] = useState("");
  //const [aboutMeSummary, setAboutMeSummary] = useState("");
  //const [isLoading, setIsLoading] = useState(false);

  // Fetch stored about-me on dialog open

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle>Profile</DialogTitle>
          {/* <Button
            onClick={handleSaveAboutMe}
            disabled={isLoading}
            className="absolute top-2 right-2 gap-2 bg-[#4BA3C3] hover:bg-[#2A9D8F] h-8 px-3 text-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            About me
          </Button> */}
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
