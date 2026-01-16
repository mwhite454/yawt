import { useMemo, useState } from "preact/hooks";

type UploadResponse = {
  objectKey: string;
  contentType: string;
  bytes: number;
};

type Props = {
  seriesId: string;
  characterId: string;
  existingObjectKey?: string;
  existingContentType?: string;
};

export default function CharacterImageUploader(props: Props) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "saving" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const hasExisting = useMemo(() => {
    return Boolean(props.existingObjectKey);
  }, [props.existingObjectKey]);

  async function onPickFile(file: File | null) {
    setError(null);
    setStatus("idle");

    if (!file) return;
    setFileName(file.name);

    try {
      setStatus("uploading");

      const form = new FormData();
      form.set("file", file);

      const uploadRes = await fetch(
        `/api/series/${props.seriesId}/characters/${props.characterId}/image/upload`,
        {
          method: "POST",
          credentials: "same-origin",
          body: form,
        }
      );

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

      const saveRes = await fetch(
        `/api/series/${props.seriesId}/characters/${props.characterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            image: {
              objectKey: uploaded.objectKey,
              contentType: uploaded.contentType,
            },
          }),
        }
      );

      if (!saveRes.ok) {
        const body = (await saveRes.json()) as {
          error?: string;
          detail?: string;
        };
        const msg = body.error || saveRes.statusText;
        throw new Error(body.detail ? `${msg}: ${body.detail}` : msg);
      }

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div class="grid gap-2">
      <div class="flex items-center gap-2">
        {hasExisting && <span class="badge badge-success">has image</span>}
        {!hasExisting && <span class="badge badge-ghost">no image</span>}
        {props.existingObjectKey && (
          <span class="text-xs opacity-60 truncate max-w-xs">
            {props.existingObjectKey}
          </span>
        )}
      </div>

      <input
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
