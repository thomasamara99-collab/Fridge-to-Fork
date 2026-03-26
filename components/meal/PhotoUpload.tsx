"use client";

import Image from "next/image";
type PhotoUploadProps = {
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
  error?: string;
};

export default function PhotoUpload({
  previewUrl,
  onFileChange,
  error,
}: PhotoUploadProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-tertiary">
        Photo (optional)
      </p>
      <div className="mt-3 space-y-3">
        {previewUrl ? (
          <div className="relative h-48 overflow-hidden rounded-md border border-border">
            <Image
              src={previewUrl}
              alt="Meal preview"
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-border bg-surface-2 text-sm text-text-tertiary">
            Upload a photo to show this meal
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onFileChange(file);
          }}
          className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-accent-light file:px-4 file:py-2 file:text-xs file:font-medium file:text-accent-text"
        />
        {error ? <p className="text-xs text-accent-text">{error}</p> : null}
      </div>
    </div>
  );
}
