/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { images } from "@/config/images";

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export default function ImageSelectionModal({ isOpen, onClose, onSelect }: ImageSelectionModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>프로필 이미지 선택</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {images.map((image) => (
            <img
              key={image}
              src={image}
              alt="character"
              className={`cursor-pointer w-20 h-20 object-cover rounded-full ${
                selectedImage === image ? 'border-4 border-slate-300/90' : ''
              }`}
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">취소</Button>
          <Button onClick={handleConfirm} disabled={!selectedImage}>선택 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}