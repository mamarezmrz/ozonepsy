import path from "node:path";

const imageTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]) },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP" },
} as const;

export function validateImageBytes(mimeType: string, body: Uint8Array) {
  const definition = imageTypes[mimeType as keyof typeof imageTypes];
  if (!definition || !definition.signature(body)) throw new Error("فایل تصویر معتبر نیست.");
  return definition.extension;
}

export function sanitizeOriginalName(name: string) {
  const base = path.basename(name).replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/-+/g, "-");
  return base.slice(0, 255) || "upload";
}
