import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.540.0";
import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.540.0";

function env(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v && v.trim() ? v.trim() : undefined;
}

let client: S3Client | null = null;

export function getR2Bucket(): string | undefined {
  return (
    env("CLOUDFLARE_R2_BUCKET") ??
      env("CLOUDFLARE_S3_BUCKET") ??
      env("R2_BUCKET")
  );
}

function getClient(): S3Client {
  if (client) return client;

  const endpoint = env("CLOUDFLARE_S3_ENDPOINT") ?? env("R2_ENDPOINT");
  const accessKeyId = env("CLOUDFLARE_S3_ACCESS_KEY_ID") ??
    env("R2_ACCESS_KEY_ID");
  const secretAccessKey = env("CLOUDFLARE_S3_SECRET") ??
    env("CLOUDFLARE_S3_SECRET_ACCESS_KEY") ??
    env("R2_SECRET_ACCESS_KEY");

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials or endpoint in env");
  }

  client = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  return client;
}

export async function presignPutObject(args: {
  bucket: string;
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const { bucket, key, contentType, expiresInSeconds = 900 } = args;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(getClient(), command, {
    expiresIn: expiresInSeconds,
  });
}
