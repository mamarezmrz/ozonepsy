import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type MediaWriteInput = { storageKey: string; body: Uint8Array; contentType: string };

export interface MediaStorage {
  put(input: MediaWriteInput): Promise<void>;
  get(storageKey: string): Promise<Uint8Array | null>;
  delete(storageKey: string): Promise<void>;
}

class LocalMediaStorage implements MediaStorage {
  private readonly root = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.MEDIA_LOCAL_DIR ?? "../ozone-media");

  private resolveKey(storageKey: string) {
    const resolved = path.resolve(this.root, storageKey);
    if (!resolved.startsWith(`${this.root}${path.sep}`)) throw new Error("Invalid media storage key.");
    return resolved;
  }

  async put({ storageKey, body }: MediaWriteInput) {
    const filePath = this.resolveKey(storageKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, { flag: "wx" });
  }

  async get(storageKey: string) {
    try {
      return new Uint8Array(await readFile(this.resolveKey(storageKey)));
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(storageKey: string) {
    try {
      await unlink(this.resolveKey(storageKey));
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
      throw error;
    }
  }
}

class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const bucket = process.env.S3_BUCKET?.trim();
    const region = process.env.S3_REGION?.trim();
    const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
    if (!bucket || !region || !accessKeyId || !secretAccessKey) throw new Error("S3 media storage is not configured.");
    this.bucket = bucket;
    this.client = new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    });
  }

  async put({ storageKey, body, contentType }: MediaWriteInput) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, Body: body, ContentType: contentType }));
  }

  async get(storageKey: string) {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return response.Body ? new Uint8Array(await response.Body.transformToByteArray()) : null;
    } catch (error) {
      if (typeof error === "object" && error !== null && "name" in error && error.name === "NoSuchKey") return null;
      throw error;
    }
  }

  async delete(storageKey: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }
}

export function getMediaStorage(): MediaStorage {
  const provider = process.env.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase() || "local";
  if (provider === "local") return new LocalMediaStorage();
  if (provider === "s3") return new S3MediaStorage();
  throw new Error("MEDIA_STORAGE_PROVIDER must be local or s3.");
}
