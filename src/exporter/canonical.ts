const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize);
  if (!isPlainObject(value)) return value;
  const entries = Object.entries(value)
    .filter(([key]) => key !== "editor" && key !== "generatedAt")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => [key, normalize(child)]);
  return Object.fromEntries(entries);
};

export const canonicalJson = (value: unknown): string =>
  JSON.stringify(normalize(value));

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const sha256BytesHex = async (bytes: Uint8Array): Promise<string> => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return toHex(new Uint8Array(digest));
};

export const sha256Hex = async (value: unknown): Promise<string> => {
  const data = new TextEncoder().encode(canonicalJson(value));
  return sha256BytesHex(data);
};

export const shortStableId = (value: unknown): string => {
  const text = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
