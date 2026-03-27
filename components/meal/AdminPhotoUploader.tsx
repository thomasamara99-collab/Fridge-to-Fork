"use client";

import { useState } from "react";

type AdminPhotoUploaderProps = {
  mealId: string;
};

export default function AdminPhotoUploader({ mealId }: AdminPhotoUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const uploadPhotos = async () => {
    if (!files.length) {
      setStatus("error");
      setMessage("Choose a photo to upload.");
      return;
    }

    setStatus("uploading");
    setMessage(null);

    try {
      await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("photo", file);
          const response = await fetch(`/api/meals/${mealId}/photo`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed.");
          }
        }),
      );
      setStatus("success");
      setMessage("Photo uploaded. Refresh to see it.");
    } catch {
      setStatus("error");
      setMessage("Upload failed. Try again.");
    }
  };

  return (
    <section className="rounded-card border border-dashed border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-tertiary">
        Admin photo upload
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        Upload a meal photo that is stored in shared storage.
      </p>
      <div className="mt-3 space-y-2">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-accent-light file:px-4 file:py-2 file:text-xs file:font-medium file:text-accent-text"
        />
        {message ? (
          <p
            className={`text-xs ${
              status === "success" ? "text-green-text" : "text-accent-text"
            }`}
          >
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void uploadPhotos()}
          disabled={status === "uploading"}
          className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-secondary disabled:opacity-60"
        >
          {status === "uploading" ? "Uploading..." : "Upload photo"}
        </button>
      </div>
    </section>
  );
}
