import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { FileText, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface MediaFile {
  name: string;
}

interface UploadedMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChatId?: string;
}

export function UploadedMediaDialog({ open, onOpenChange, currentChatId }: UploadedMediaDialogProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Fetch media files when dialog opens
  useEffect(() => {
    if (open && currentChatId) {
      fetchMediaFiles();
    }
  }, [open, currentChatId]);

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch(`http://localhost:8000/chat-data/${currentChatId}`);
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.media_files.map((filename: string) => ({ name: filename })));
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
    }
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  const getFileIcon = (filename: string) => {
    const type = getFileType(filename);
    if (type === 'JPG' || type === 'PNG' || type === 'GIF' || type === 'JPEG') {
      return <ImageIcon className="w-12 h-12 text-[#4BA3C3]" />;
    }
    return <FileText className="w-12 h-12 text-[#4BA3C3]" />;
  };

  const getTypeBadgeColor = (filename: string) => {
    const type = getFileType(filename);
    switch (type) {
      case "PDF":
        return "bg-red-100 text-red-700";
      case "JPG":
      case "PNG":
      case "GIF":
      case "JPEG":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl backdrop-blur-md bg-white/95 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#333333]">Uploaded Media</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {mediaFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Thumbnail/Icon */}
                <div className="flex items-center justify-center h-24 bg-[#F9FBFC] rounded-lg mb-3">
                  {getFileIcon(file.name)}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <p className="text-sm text-[#333333] truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`text-xs ${getTypeBadgeColor(file.name)}`}
                      variant="secondary"
                    >
                      {getFileType(file.name)}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {mediaFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p>No media uploaded yet</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
