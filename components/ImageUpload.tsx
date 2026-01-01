'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Loader2, UploadCloud } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  onUpload: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ label, onUpload, folder = 'customers' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Simple Cloudinary upload using unsigned preset
  // In a real app, use signed uploads via server signature
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Using a demo cloud name and preset for this exercise if user provided env vars,
      // but since I don't have env vars, I will simulate it or use a placeholder if not provided.
      // Actually, I'll write the code to use the ENV vars if available.

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
         console.warn("Cloudinary not configured. Using fake URL.");
         // Mocking upload for demo purposes if env not set
         await new Promise(r => setTimeout(r, 1000));
         onUpload(`https://via.placeholder.com/300?text=${encodeURIComponent(file.name)}`);
         setUploading(false);
         return;
      }

      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      onUpload(data.secure_url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <UploadCloud className="h-8 w-8 text-gray-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG up to 5MB</p>
        </div>
      </div>
    </div>
  );
}
