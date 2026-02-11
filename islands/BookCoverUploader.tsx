import { useEffect, useRef, useState } from "preact/hooks";
import type { AssetImage } from "@utils/story/types.ts";

type UploadResponse = {
  objectKey: string;
  contentType: string;
  bytes: number;
};

type Props = {
  uploadPath: string;
  updatePath: string;
  fieldName: string;
  existingCoverImage?: AssetImage;
};

export default function BookCoverUploader(props: Props) {
  const timeoutRef = useRef<number | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "saving" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentCoverImage, setCurrentCoverImage] = useState<
    AssetImage | undefined
  >(props.existingCoverImage);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentCoverImage(props.existingCoverImage);
  }, [props.existingCoverImage]);

  async function onPickFile(file: File | null) {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

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
        const msg =
          ("error" in uploadJson && uploadJson.error) || uploadRes.statusText;
        const detail =
          "detail" in uploadJson && uploadJson.detail
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

      setCurrentCoverImage({
        objectKey: uploaded.objectKey,
        contentType: uploaded.contentType,
      });
      setStatus("done");

      timeoutRef.current = window.setTimeout(() => {
        setStatus("idle");
        timeoutRef.current = null;
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div class="flex flex-col gap-4">
      {currentCoverImage && (
        <img
          src={`/api/image?key=${encodeURIComponent(currentCoverImage.objectKey)}`}
          alt="Cover"
          class="max-w-48 rounded-lg shadow"
        />
      )}

      <input
        type="file"
        accept="image/*"
        class="file-input file-input-bordered w-full max-w-xs"
        disabled={status === "uploading" || status === "saving"}
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
