import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { toArabicDigits } from '../../utils/numberUtils';

interface ImageViewerModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title = 'معاينة المستندات والصور المرفقة',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) {
        handlePrev();
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex];

  const handleNext = () => {
    setZoom(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setZoom(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 select-none"
      dir="rtl"
      onClick={onClose}
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-900/80 rounded-2xl border border-slate-800 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm">{title}</span>
          {images.length > 1 && (
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
              {toArabicDigits(currentIndex + 1)} من {toArabicDigits(images.length)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(prev + 0.3, 3))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(prev - 0.3, 0.5))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <a
            href={currentImg}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="فتح بالحجم الكامل أو تحميل"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition ml-1"
            title="إغلاق (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute right-4 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-white z-20 transition shadow-lg"
            title="الصورة السابقة"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Center Image */}
        <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-150">
          <img
            src={currentImg}
            alt="مرفق الفاتورة"
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-transform"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute left-4 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-white z-20 transition shadow-lg"
            title="الصورة التالية"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple) */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 p-2 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-x-auto max-w-2xl mx-auto z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => {
                setZoom(1);
                setCurrentIndex(i);
              }}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                i === currentIndex
                  ? 'border-amber-400 scale-105 shadow-md'
                  : 'border-slate-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`مصغرة ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
