import { unzipSync } from "fflate";
import { SOCKET_REVIEW_CANDIDATES } from "../content/socket-review";
import { sha256BytesHex } from "../exporter/canonical";
import {
  SPRITE_FORGE_ACTORS,
  SPRITE_FORGE_MANIFEST_SHA256,
  type SpriteForgeActorId,
  type SpriteForgeSheetSet,
} from "../fixtures/sprite-forge-full/assets";

const MAX_ZIP_BYTES = 32 * 1024 * 1024;
const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
const MAX_ENTRIES = 2_000;

interface SpriteForgeManifestRow {
  label: string;
  frames: number;
}

interface SpriteForgeManifestActor {
  id: string;
  name?: string;
  category?: string;
  cell: number;
  scale: number;
  sheet: string;
  rows: SpriteForgeManifestRow[];
  flags?: {
    rig?: string;
  };
}

export interface SpriteForgeManifest {
  pack: string;
  generated?: string;
  theme?: string;
  scale: number;
  counts?: Record<string, number>;
  actors: SpriteForgeManifestActor[];
}

export interface ImportedSpriteForgeActor {
  actorId: SpriteForgeActorId;
  label: string;
  sheetPath: string;
  width: number;
  height: number;
  bytes: Uint8Array;
}

export interface ImportedSpriteForgePack {
  fileName: string;
  manifestPath: string;
  manifestSha256: string;
  matchesEmbeddedManifest: boolean;
  entryCount: number;
  uncompressedBytes: number;
  actorCount: number;
  theme: string;
  scale: number;
  manifest: SpriteForgeManifest;
  actors: Record<SpriteForgeActorId, ImportedSpriteForgeActor>;
}

export class SpriteForgeZipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpriteForgeZipError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeZipPath = (rawPath: string): string => {
  if (!rawPath || rawPath.includes("\0")) {
    throw new SpriteForgeZipError("ZIP contains an invalid empty path.");
  }
  const slashPath = rawPath.replaceAll("\\", "/");
  if (slashPath.startsWith("/") || /^[A-Za-z]:/.test(slashPath)) {
    throw new SpriteForgeZipError(`ZIP contains an absolute path: ${rawPath}`);
  }

  const parts: string[] = [];
  for (const part of slashPath.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      throw new SpriteForgeZipError(`ZIP path escapes its root: ${rawPath}`);
    }
    parts.push(part);
  }
  if (parts.length === 0) {
    throw new SpriteForgeZipError(`ZIP contains an invalid path: ${rawPath}`);
  }
  return parts.join("/");
};

const directoryOf = (path: string): string => {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
};

const resolveBesideManifest = (
  manifestPath: string,
  relativePath: string,
): string => {
  if (!relativePath || relativePath.endsWith("/")) {
    throw new SpriteForgeZipError(`Manifest has an invalid sheet path: ${relativePath}`);
  }
  const root = directoryOf(manifestPath);
  return normalizeZipPath(root ? `${root}/${relativePath}` : relativePath);
};

const readManifest = (bytes: Uint8Array): SpriteForgeManifest => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new SpriteForgeZipError("manifest.json is not valid UTF-8 JSON.");
  }
  if (!isRecord(parsed)) {
    throw new SpriteForgeZipError("manifest.json must contain a JSON object.");
  }
  if (typeof parsed.pack !== "string" || parsed.pack.trim().length === 0) {
    throw new SpriteForgeZipError("manifest.json is missing its pack name.");
  }
  if (!Number.isInteger(parsed.scale) || Number(parsed.scale) < 1 || Number(parsed.scale) > 8) {
    throw new SpriteForgeZipError("manifest.json has an invalid pack scale.");
  }
  if (!Array.isArray(parsed.actors) || parsed.actors.length === 0) {
    throw new SpriteForgeZipError("manifest.json has no actors.");
  }
  if (parsed.actors.length > 5_000) {
    throw new SpriteForgeZipError("manifest.json declares too many actors.");
  }

  const actorIds = new Set<string>();
  for (const value of parsed.actors) {
    if (!isRecord(value)) {
      throw new SpriteForgeZipError("manifest.json contains an invalid actor.");
    }
    if (typeof value.id !== "string" || value.id.length === 0) {
      throw new SpriteForgeZipError("A manifest actor is missing its id.");
    }
    if (actorIds.has(value.id)) {
      throw new SpriteForgeZipError(`Manifest actor id is duplicated: ${value.id}`);
    }
    actorIds.add(value.id);
    if (
      typeof value.sheet !== "string" ||
      !Number.isInteger(value.cell) ||
      Number(value.cell) < 1 ||
      !Number.isInteger(value.scale) ||
      Number(value.scale) < 1 ||
      !Array.isArray(value.rows) ||
      value.rows.length === 0
    ) {
      throw new SpriteForgeZipError(`Manifest actor is incomplete: ${value.id}`);
    }
    for (const row of value.rows) {
      if (
        !isRecord(row) ||
        typeof row.label !== "string" ||
        !Number.isInteger(row.frames) ||
        Number(row.frames) < 1
      ) {
        throw new SpriteForgeZipError(`Manifest actor has an invalid row: ${value.id}`);
      }
    }
  }

  return parsed as unknown as SpriteForgeManifest;
};

const readPngDimensions = (
  bytes: Uint8Array,
  sheetPath: string,
): { width: number; height: number } => {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 24 ||
    signature.some((value, index) => bytes[index] !== value) ||
    new TextDecoder().decode(bytes.subarray(12, 16)) !== "IHDR"
  ) {
    throw new SpriteForgeZipError(`Actor sheet is not a valid PNG: ${sheetPath}`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (width === 0 || height === 0) {
    throw new SpriteForgeZipError(`Actor sheet has invalid dimensions: ${sheetPath}`);
  }
  return { width, height };
};

const requiredActorIds = Object.keys(SPRITE_FORGE_ACTORS) as SpriteForgeActorId[];

export const parseSpriteForgeZip = async (
  bytes: Uint8Array,
  fileName = "sprite-forge-pack.zip",
): Promise<ImportedSpriteForgePack> => {
  if (bytes.byteLength === 0) {
    throw new SpriteForgeZipError("Choose a non-empty Sprite Forge ZIP.");
  }
  if (bytes.byteLength > MAX_ZIP_BYTES) {
    throw new SpriteForgeZipError("ZIP exceeds the 32 MB import limit.");
  }

  let entryCount = 0;
  let uncompressedBytes = 0;
  let rawEntries: Record<string, Uint8Array>;
  try {
    rawEntries = unzipSync(bytes, {
      filter: (entry) => {
        entryCount += 1;
        if (entryCount > MAX_ENTRIES) {
          throw new SpriteForgeZipError("ZIP contains more than 2,000 entries.");
        }
        normalizeZipPath(entry.name);
        if (entry.originalSize > MAX_ENTRY_BYTES) {
          throw new SpriteForgeZipError(`ZIP entry exceeds 8 MB: ${entry.name}`);
        }
        uncompressedBytes += entry.originalSize;
        if (uncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
          throw new SpriteForgeZipError("ZIP expands beyond the 64 MB import limit.");
        }
        return !entry.name.endsWith("/");
      },
    });
  } catch (error) {
    if (error instanceof SpriteForgeZipError) throw error;
    throw new SpriteForgeZipError(
      `Could not read ZIP: ${error instanceof Error ? error.message : "invalid archive"}`,
    );
  }

  const entries = new Map<string, Uint8Array>();
  for (const [rawPath, entryBytes] of Object.entries(rawEntries)) {
    const path = normalizeZipPath(rawPath);
    if (entries.has(path)) {
      throw new SpriteForgeZipError(`ZIP contains a duplicate normalized path: ${path}`);
    }
    entries.set(path, entryBytes);
  }

  const manifestPaths = [...entries.keys()].filter(
    (path) => path.toLowerCase().split("/").at(-1) === "manifest.json",
  );
  if (manifestPaths.length !== 1) {
    throw new SpriteForgeZipError(
      manifestPaths.length === 0
        ? "ZIP must contain one manifest.json."
        : "ZIP contains multiple manifest.json files.",
    );
  }

  const manifestPath = manifestPaths[0]!;
  const manifestBytes = entries.get(manifestPath)!;
  const manifest = readManifest(manifestBytes);
  const manifestActors = new Map(manifest.actors.map((actor) => [actor.id, actor]));
  const importedActors = {} as Record<SpriteForgeActorId, ImportedSpriteForgeActor>;

  for (const actorId of requiredActorIds) {
    const actor = manifestActors.get(actorId);
    if (!actor) {
      throw new SpriteForgeZipError(
        `Manifest is missing required representative actor: ${actorId}`,
      );
    }
    if (actor.cell !== 32 || actor.scale !== 2) {
      throw new SpriteForgeZipError(
        `${actorId} must use a 32 px logical cell at export scale 2.`,
      );
    }
    const candidate = SOCKET_REVIEW_CANDIDATES.find(
      (entry) => entry.actorId === actorId,
    )!;
    const candidateRow = actor.rows[candidate.sourceRow];
    if (
      candidateRow?.label !== `${candidate.sequence}-${candidate.direction}` ||
      candidateRow.frames !== candidate.frameCount
    ) {
      throw new SpriteForgeZipError(
        `${actorId} does not match the required ${candidate.sequence}-${candidate.direction} row contract.`,
      );
    }
    const sheetPath = resolveBesideManifest(manifestPath, actor.sheet);
    const sheetBytes = entries.get(sheetPath);
    if (!sheetBytes) {
      throw new SpriteForgeZipError(`ZIP is missing actor sheet: ${sheetPath}`);
    }
    const dimensions = readPngDimensions(sheetBytes, sheetPath);
    const cellPixels = actor.cell * actor.scale;
    const expectedWidth =
      Math.max(...actor.rows.map((row) => row.frames)) * cellPixels;
    const expectedHeight = actor.rows.length * cellPixels;
    if (
      dimensions.width !== expectedWidth ||
      dimensions.height !== expectedHeight
    ) {
      throw new SpriteForgeZipError(
        `${actorId} sheet is ${dimensions.width}x${dimensions.height}; expected ${expectedWidth}x${expectedHeight}.`,
      );
    }
    importedActors[actorId] = {
      actorId,
      label: actor.name ?? SPRITE_FORGE_ACTORS[actorId].label,
      sheetPath,
      width: dimensions.width,
      height: dimensions.height,
      bytes: sheetBytes,
    };
  }

  const manifestSha256 = await sha256BytesHex(manifestBytes);
  return {
    fileName,
    manifestPath,
    manifestSha256,
    matchesEmbeddedManifest:
      manifestSha256.toUpperCase() === SPRITE_FORGE_MANIFEST_SHA256,
    entryCount,
    uncompressedBytes,
    actorCount: manifest.actors.length,
    theme: manifest.theme ?? "unspecified",
    scale: manifest.scale,
    manifest,
    actors: importedActors,
  };
};

const loadPng = (
  bytes: Uint8Array,
  label: string,
): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const objectUrl = URL.createObjectURL(
      new Blob([copy.buffer], { type: "image/png" }),
    );
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new SpriteForgeZipError(`Could not decode actor sheet: ${label}`));
    };
    image.src = objectUrl;
  });

export const loadImportedSpriteForgeSheets = async (
  pack: ImportedSpriteForgePack,
): Promise<SpriteForgeSheetSet> => {
  const entries = await Promise.all(
    requiredActorIds.map(
      async (actorId) =>
        [actorId, await loadPng(pack.actors[actorId].bytes, actorId)] as const,
    ),
  );
  return Object.fromEntries(entries) as SpriteForgeSheetSet;
};
