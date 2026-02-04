import { useRef, useState } from "preact/hooks";
import { BookCover } from "@components/BookCover.tsx";
import type { AssetImage } from "@utils/story/types.ts";

type UploadResponse = {
  objectKey: string;
  contentType: string;
  bytes: number;
};

type Props = {
  title: string;
  authorName: string;
  uploadPath: string;
  updatePath: string;
  fieldName: string;
  existingCoverImage?: AssetImage;
};

export default function BookCoverUploader(props: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "saving" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentCoverImage, setCurrentCoverImage] = useState<
    AssetImage | undefined
  >(props.existingCoverImage);

  function handleBookCoverClick() {
    fileInputRef.current?.click();
  }

  async function onPickFile(file: File | null) {
    setError(null);
    setStatus("idle");

    if (!file) return;

    try {
      setStatus("uploading");

      const form = new FormData();
      form.set("file", file);

      const uploadRes = await fetch(props.uploadPath, {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });

      const uploadJson = (await uploadRes.json()) as
        | UploadResponse
        | { error?: string; detail?: string };

      if (!uploadRes.ok) {
        const msg = ("error" in uploadJson && uploadJson.error) ||
          uploadRes.statusText;
        const detail = "detail" in uploadJson && uploadJson.detail
          ? `: ${uploadJson.detail}`
          : "";
        throw new Error(`${msg}${detail}`);
      }

      const uploaded = uploadJson as UploadResponse;

      setStatus("saving");

      const saveRes = await fetch(props.updatePath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          [props.fieldName]: {
            objectKey: uploaded.objectKey,
            contentType: uploaded.contentType,
          },
        }),
      });

      if (!saveRes.ok) {
        const body = (await saveRes.json()) as {
          error?: string;
          detail?: string;
        };
        const msg = body.error || saveRes.statusText;
        throw new Error(body.detail ? `${msg}: ${body.detail}` : msg);
      }

      // Update local state so UI reflects new image immediately
      setCurrentCoverImage({
        objectKey: uploaded.objectKey,
        contentType: uploaded.contentType,
      });
      setStatus("done");

      // Clear the done status after 3 seconds
      setTimeout(() => {
        setStatus((prevStatus) => prevStatus === "done" ? "idle" : prevStatus);
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div class="grid gap-2">
      <BookCover
        title={props.title}
        authorName={props.authorName}
        coverImage={currentCoverImage}
        onClick={handleBookCoverClick}
      />

      <input
        ref={fileInputRef}
        class="hidden"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const input = e.currentTarget as HTMLInputElement;
          void onPickFile(input.files?.item(0) ?? null);
        }}
      />

      {status === "uploading" && (
        <div class="flex items-center gap-2 text-sm">
          <span class="loading loading-spinner loading-sm" />
          Uploading…
        </div>
      )}

      {status === "saving" && (
        <div class="flex items-center gap-2 text-sm">
          <span class="loading loading-spinner loading-sm" />
          Saving…
        </div>
      )}

      {status === "done" && (
        <div class="alert alert-success py-2">
          <span>Cover uploaded successfully!</span>
        </div>
      )}

      {status === "error" && (
        <div class="alert alert-error py-2">
          <span>Upload failed: {error}</span>
        </div>
      )}
    </div>
  );
}
