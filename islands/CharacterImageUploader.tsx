import { useMemo, useState } from "preact/hooks";

type PresignResponse = {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
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

      const presignRes = await fetch(
        `/api/series/${props.seriesId}/characters/${props.characterId}/image/presign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ contentType: file.type }),
        },
      );

      const presignJson = (await presignRes.json()) as
        | PresignResponse
        | { error?: string; detail?: string };

      if (!presignRes.ok) {
        throw new Error(
          ("error" in presignJson && presignJson.error) ||
            presignRes.statusText,
        );
      }

      const presign = presignJson as PresignResponse;

      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: presign.headers,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(
          `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
        );
      }

      setStatus("saving");

      const saveRes = await fetch(
        `/api/series/${props.seriesId}/characters/${props.characterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            image: {
              objectKey: presign.objectKey,
              contentType: file.type,
            },
          }),
        },
      );

      if (!saveRes.ok) {
        const body = (await saveRes.json()) as { error?: string };
        throw new Error(body.error || saveRes.statusText);
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
        Uses the presigned PUT endpoint (R2).
      </div>
    </div>
  );
}
