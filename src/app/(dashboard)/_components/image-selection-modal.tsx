/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import ConfirmModal from "@/components/confirm-modal";

interface ImageSelectionModalProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}

const images = [
  "/characters/anonymous.png",
  "/characters/m2.png",
  "/characters/m3.png",
  "/characters/m4.png",
  "/characters/m5.png",
  "/characters/m1.png",
  "/characters/w1.png",
  "/characters/w2.png",
  "/characters/w3.png",
  "/characters/w4.png",
  "/characters/w5.png",
];

export default function ImageSelectionModal({ onSelect, onClose }: ImageSelectionModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <ConfirmModal
      header="이미지 선택"
      onConfirm={handleConfirm}
    >      
      <div>
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <img
              key={image}
              src={image}
              alt="character"
              className={`cursor-pointer ${selectedImage === image ? 'border-2 border-blue-500' : ''}`}
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleCancel} className="mr-2">취소</button>
          <button onClick={handleConfirm} className="bg-blue-500 text-white px-4 py-2 rounded">확인</button>
        </div>
      </div>
    </ConfirmModal>
  );
}
