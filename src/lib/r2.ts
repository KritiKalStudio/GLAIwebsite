import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getMediaBaseUrl, requiredEnv } from "@/lib/env";

let client: S3Client | null = null;

function r2Failure(error: unknown): Error {
  const status =
    typeof error === "object" && error && "$metadata" in error
      ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
      : undefined;
  if (status === 400) {
    return new Error(
      "Cloudflare R2 rejected the storage request. Check that R2_ENDPOINT is the account S3 API endpoint and that the access key has read/write permission for the configured bucket.",
    );
  }
  return error instanceof Error ? error : new Error("Cloudflare R2 media request failed.");
}

export function getR2Client(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: requiredEnv("R2_ENDPOINT"),
    // R2's account endpoint expects the bucket as part of the request path.
    // Without this the AWS client prefixes the bucket as a hostname, which R2
    // rejects with its otherwise unhelpful HTTP 400 `UnknownError` response.
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

export function getBucketName(): string {
  return requiredEnv("R2_BUCKET_NAME");
}

export function publicMediaUrl(key: string): string {
  const base = getMediaBaseUrl();
  const cleanKey = key.replace(/^\//, "");
  if (!base) return `/${cleanKey}`;
  return `${base}/${cleanKey}`;
}

export async function pingR2Bucket(): Promise<void> {
  try {
    await getR2Client().send(new HeadBucketCommand({ Bucket: getBucketName() }));
  } catch (error) {
    throw r2Failure(error);
  }
}

export async function putObject(options: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getBucketName(), Key: options.key, Body: options.body, ContentType: options.contentType,
      }),
    );
  } catch (error) {
    throw r2Failure(error);
  }
  return { key: options.key, url: publicMediaUrl(options.key) };
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );
  if (!response.Body) {
    throw new Error(`R2 object ${key} has no body`);
  }
  return Buffer.from(await response.Body.transformToByteArray());
}

export async function deleteObject(key: string): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );
}
