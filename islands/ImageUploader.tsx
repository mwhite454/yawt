import { useEffect, useMemo, useState } from "preact/hooks";

type UploadResponse = {
  objectKey: string;
  contentType: string;
  bytes: number;
};

type Props = {
  uploadPath: string;
  updatePath: string;
  fieldName: string;
  existingObjectKey?: string;
  existingContentType?: string;
  label?: string;
};

export default function ImageUploader(props: Props) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "saving" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  // Track current image state locally so UI updates immediately after upload
  const [currentObjectKey, setCurrentObjectKey] = useState<string | undefined>(
    props.existingObjectKey,
  );
  const [currentContentType, setCurrentContentType] = useState<
    string | undefined
  >(props.existingContentType);

  // Sync local state when props change (e.g., navigating between entities)
  useEffect(() => {
    setCurrentObjectKey(props.existingObjectKey);
    setCurrentContentType(props.existingContentType);
  }, [props.existingObjectKey, props.existingContentType]);

  const hasExisting = useMemo(() => {
    return Boolean(currentObjectKey);
  }, [currentObjectKey]);

  // Generate stable ID for accessibility with robust sanitization
  const inputId = useMemo(() => {
    const sanitizedPath = props.updatePath
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `image-upload-${props.fieldName}-${sanitizedPath}`;
  }, [props.fieldName, props.updatePath]);

  async function onPickFile(file: File | null) {
    setError(null);
    setStatus("idle");

    if (!file) return;
    setFileName(file.name);

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
      setCurrentObjectKey(uploaded.objectKey);
      setCurrentContentType(uploaded.contentType);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div class="grid gap-2">
      {props.label && (
        <label class="label" htmlFor={inputId}>
          <span class="label-text">{props.label}</span>
        </label>
      )}

      <div class="flex items-center gap-2">
        {hasExisting && <span class="badge badge-success">has image</span>}
        {!hasExisting && <span class="badge badge-ghost">no image</span>}
        {currentObjectKey && (
          <span class="text-xs opacity-60 truncate max-w-xs">
            {currentObjectKey}
          </span>
        )}
      </div>

      <input
        id={inputId}
        class="file-input file-input-bordered file-input-sm w-full"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const input = e.currentTarget as HTMLInputElement;
          void onPickFile(input.files?.item(0) ?? null);
        }}
      />

      {fileName && (
        <div class="text-xs opacity-70">
          Selected: <span class="font-mono">{fileName}</span>
        </div>
      )}

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
          <span>Uploaded.</span>
        </div>
      )}

      {status === "error" && (
        <div class="alert alert-error py-2">
          <span>Upload failed: {error}</span>
        </div>
      )}

      <div class="text-xs opacity-60">
        Uploads via same-origin API (no direct browser-to-R2 upload).
      </div>
    </div>
  );
}
