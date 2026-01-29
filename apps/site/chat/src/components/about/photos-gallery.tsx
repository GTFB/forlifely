"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Using available images from /images folder
const galleryImages = [
  "/images/interier-1.jpg",
  "/images/interier-2.jpg",
  "/images/interier-3.jpg",
  "/images/interier-4.jpg",
  "/images/interier-5.jpg",
  "/images/interier-6.jpg",
];

export function PhotosGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const open = selectedIndex !== null;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIndex(null);
    }
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === 0 ? galleryImages.length - 1 : selectedIndex - 1
      );
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === galleryImages.length - 1 ? 0 : selectedIndex + 1
      );
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedIndex !== null) {
          setSelectedIndex(
            selectedIndex === 0 ? galleryImages.length - 1 : selectedIndex - 1
          );
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedIndex !== null) {
          setSelectedIndex(
            selectedIndex === galleryImages.length - 1 ? 0 : selectedIndex + 1
          );
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryImages.map((src, index) => (
          <Card
            key={index}
            className="overflow-hidden p-0 cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => setSelectedIndex(index)}
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={src}
                alt={`Gallery image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-500 hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none [&>button]:hidden">
          <DialogTitle className="sr-only">
            {selectedIndex !== null
              ? `Gallery image ${selectedIndex + 1} of ${galleryImages.length}`
              : "Image gallery"}
          </DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous button */}
            {galleryImages.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <Image
                  src={galleryImages[selectedIndex]}
                  alt={`Gallery image ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
              </div>
            )}

            {/* Next button */}
            {galleryImages.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            {/* Image counter */}
            {galleryImages.length > 1 && selectedIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black/50 px-4 py-2 text-white text-sm">
                {selectedIndex + 1} / {galleryImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

