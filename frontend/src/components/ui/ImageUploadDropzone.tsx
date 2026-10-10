import React, { useState, useRef } from 'react';
import { X, Loader2, Eye, Plus } from 'lucide-react';
import { backendApi } from '../../services/api';
import toast from 'react-hot-toast';
import { ImageViewerModal } from './ImageViewerModal';

interface ImageUploadDropzoneProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  folder?: string;
  maxFiles?: number;
  label?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  images,
  onChange,
  folder = 'elmahaba/invoices',
  maxFiles = 10,
  label = 'صور ومرفقات الفاتورة (أوراق القبض / إيصالات الاستلام / بوالص الشحن)',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxFiles) {
      toast.error(`الحد الأقصى للصور هو ${maxFiles} صور لكل فاتورة`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(`جاري رفع ${files.length} صورة إلى Cloudinary...`);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`الملف ${file.name} ليس صورة صالحة`);
          continue;
        }

        // Convert to base64 data URL
        const dataUrl = await readFileAsDataURL(file);
        setUploadProgress(`جاري رفع الصورة ${i + 1} من ${files.length}...`);

        const res = await backendApi.uploadImage(dataUrl, folder);
        if (res && res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
        toast.success(`تم رفع ${uploadedUrls.length} صورة بنجاح إلى السحابة`);
      }
    } catch (err: any) {
      toast.error(`حدث خطأ أثناء الرفع: ${err.message || 'فشل الاتصال'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        {images.length > 0 && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {images.length} صورة مرفقة
          </span>
        )}
      </div>

      {/* Grid of uploaded images + upload button */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {images.map((imgUrl, idx) => (
          <div
            key={`img-${idx}`}
            className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs hover:shadow-md transition-all"
          >
            <img src={imgUrl} alt={`مرفق ${idx + 1}`} className="w-full h-full object-cover" />

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPreviewIndex(idx);
                  setPreviewModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white hover:scale-110 transition shadow-xs"
                title="معاينة بالحجم الكامل"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 hover:scale-110 transition shadow-xs"
                title="حذف الصورة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload Trigger Button Card */}
        {images.length < maxFiles && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#f28913] bg-slate-50/70 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5 text-amber-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[10px] font-bold">{uploadProgress || 'جاري الرفع...'}</span>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-[#f28913] group-hover:border-orange-200 transition mb-1.5">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-[#f28913] transition">
                  إضافة صورة
                </span>
                <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Preview Modal */}
      <ImageViewerModal
        images={images}
        initialIndex={selectedPreviewIndex}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  );
};
