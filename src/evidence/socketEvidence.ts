import {
  CANDIDATE_ACTOR_COMBAT_BINDINGS,
  SOCKET_REVIEW_CANDIDATES,
  SOCKET_REVIEW_STATUS,
  type SocketReviewCandidate,
} from "../content/socket-review";
import { RECIPE_BY_ID } from "../content/recipes";
import { canonicalJson, sha256BytesHex, sha256Hex } from "../exporter/canonical";
import {
  SPRITE_FORGE_ACTORS,
  SPRITE_FORGE_MANIFEST_SHA256,
  type SpriteForgeSheetSet,
} from "../fixtures/sprite-forge-full/assets";
import spriteManifest from "../fixtures/sprite-forge-full/manifest.json";
import { BINDING_PREVIEW_EFFECTS } from "../lab/bindingPreview";

export const SOCKET_EVIDENCE_LAYOUT = {
  width: 956,
  height: 508,
  columns: 3,
  rows: 2,
  cardWidth: 300,
  cardHeight: 232,
  margin: 16,
  gap: 12,
  renderedFrameSize: 128,
} as const;

export interface SocketEvidencePixels {
  width: number;
  height: number;
  rgba: Uint8Array | Uint8ClampedArray;
}

export interface SocketEvidenceCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SocketEvidenceActor {
  actorId: string;
  label: string;
  row: number;
  rowLabel: string;
  frameCount: number;
  prefireFrame: number;
  releaseEvent: string;
  releaseFrame: number;
  mainSocket: string;
  prefireSocket: [number, number];
  releaseSocket: [number, number];
  effectId: string;
}

export interface SocketEvidenceReport {
  forge: "tileforge-effect-forge";
  evidenceVersion: "0.1.0";
  kind: "socket-release-review";
  status: "candidate";
  valid: boolean;
  approval: {
    state: "open";
    approved: number;
    total: number;
  };
  source: {
    actorPackManifestSha256: string;
    bindingSha256: string;
  };
  visual: {
    width: number;
    height: number;
    pixelSha256: string;
    statesPerActor: 2;
    stateCount: number;
  };
  checks: SocketEvidenceCheck[];
  actors: SocketEvidenceActor[];
}

const pointFor = (
  candidate: SocketReviewCandidate,
  frame: number,
): [number, number] => {
  const binding =
    CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
      candidate.direction
    ]![candidate.sequence]!;
  const point = binding.frames[frame]![candidate.mainSocket];
  if (!point) {
    throw new Error(
      `Missing ${candidate.mainSocket} on ${candidate.actorId} frame ${frame}`,
    );
  }
  return point;
};

const coordinatesAreValid = (): boolean =>
  SOCKET_REVIEW_CANDIDATES.every((candidate) =>
    candidate.frames.every((frame) =>
      Object.values(frame).every(
        (point) =>
          point.length === 2 &&
          point.every(
            (axis: number) =>
              Number.isInteger(axis) && axis >= 0 && axis <= 31,
          ),
      ),
    ),
  );

export const collectSocketEvidenceChecks = (
  pixels: SocketEvidencePixels,
): SocketEvidenceCheck[] => {
  const manifestActors = new Map(
    spriteManifest.actors.map((actor) => [actor.id, actor]),
  );
  const rowsMatch = SOCKET_REVIEW_CANDIDATES.every((candidate) => {
    const row = manifestActors.get(candidate.actorId)?.rows[candidate.sourceRow];
    return (
      row?.label === `${candidate.sequence}-${candidate.direction}` &&
      row.frames === candidate.frameCount
    );
  });
  const eventFramesBounded = SOCKET_REVIEW_CANDIDATES.every((candidate) => {
    const binding =
      CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
        candidate.direction
      ]![candidate.sequence]!;
    return Object.values(binding.events).every(
      (frame) => frame >= 0 && frame < candidate.frameCount,
    );
  });
  const socketsPresent = SOCKET_REVIEW_CANDIDATES.every((candidate) => {
    const binding =
      CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
        candidate.direction
      ]![candidate.sequence]!;
    return binding.frames.every((frame) => Boolean(frame[candidate.mainSocket]));
  });
  const hasVisiblePixels = pixels.rgba.some((value, index) =>
    index % 4 === 3 ? value > 0 : false,
  );

  return [
    {
      id: "actor-pack-hash",
      label: "Actor pack manifest is pinned",
      passed:
        CANDIDATE_ACTOR_COMBAT_BINDINGS.actorPackHash ===
        SPRITE_FORGE_MANIFEST_SHA256,
      detail: SPRITE_FORGE_MANIFEST_SHA256,
    },
    {
      id: "representative-cast",
      label: "Six unique review actors are present",
      passed:
        SOCKET_REVIEW_CANDIDATES.length === 6 &&
        new Set(SOCKET_REVIEW_CANDIDATES.map((entry) => entry.actorId)).size ===
          6,
      detail: SOCKET_REVIEW_CANDIDATES.map((entry) => entry.actorId).join(", "),
    },
    {
      id: "manifest-rows",
      label: "Source rows and frame counts match the manifest",
      passed: rowsMatch,
      detail: "attack-down row 8 · cast-down row 12",
    },
    {
      id: "event-bounds",
      label: "Prefire and release events are frame-bounded",
      passed: eventFramesBounded,
      detail: "zero-based event frames",
    },
    {
      id: "socket-completeness",
      label: "Every reviewed frame has its primary socket",
      passed: socketsPresent,
      detail: "hand · weaponTip · castOrigin · head",
    },
    {
      id: "coordinate-bounds",
      label: "All anchors use integer logical-cell coordinates",
      passed: coordinatesAreValid(),
      detail: "0..31 × 0..31",
    },
    {
      id: "tier1-effects",
      label: "Every release maps to a real Tier 1 effect",
      passed: SOCKET_REVIEW_CANDIDATES.every((candidate) =>
        RECIPE_BY_ID.has(BINDING_PREVIEW_EFFECTS[candidate.actorId]),
      ),
      detail: "six candidate runtime mappings",
    },
    {
      id: "visual-surface",
      label: "Evidence surface has expected dimensions and visible pixels",
      passed:
        pixels.width === SOCKET_EVIDENCE_LAYOUT.width &&
        pixels.height === SOCKET_EVIDENCE_LAYOUT.height &&
        pixels.rgba.length === pixels.width * pixels.height * 4 &&
        hasVisiblePixels,
      detail: `${pixels.width}×${pixels.height} RGBA`,
    },
  ];
};

export const buildSocketEvidenceReport = async (
  pixels: SocketEvidencePixels,
): Promise<SocketEvidenceReport> => {
  const checks = collectSocketEvidenceChecks(pixels);
  const actors: SocketEvidenceActor[] = SOCKET_REVIEW_CANDIDATES.map(
    (candidate) => {
      const binding =
        CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
          candidate.direction
        ]![candidate.sequence]!;
      const prefireFrame = binding.events["prefire.begin"]!;
      const releaseFrame = binding.events[candidate.releaseEvent]!;
      return {
        actorId: candidate.actorId,
        label: SPRITE_FORGE_ACTORS[candidate.actorId].label,
        row: candidate.sourceRow,
        rowLabel: `${candidate.sequence}-${candidate.direction}`,
        frameCount: candidate.frameCount,
        prefireFrame,
        releaseEvent: candidate.releaseEvent,
        releaseFrame,
        mainSocket: candidate.mainSocket,
        prefireSocket: pointFor(candidate, prefireFrame),
        releaseSocket: pointFor(candidate, releaseFrame),
        effectId: BINDING_PREVIEW_EFFECTS[candidate.actorId],
      };
    },
  );
  return {
    forge: "tileforge-effect-forge",
    evidenceVersion: "0.1.0",
    kind: "socket-release-review",
    status: "candidate",
    valid: checks.every((check) => check.passed),
    approval: {
      state: "open",
      approved: SOCKET_REVIEW_STATUS.approved,
      total: SOCKET_REVIEW_STATUS.total,
    },
    source: {
      actorPackManifestSha256: SPRITE_FORGE_MANIFEST_SHA256,
      bindingSha256: await sha256Hex(CANDIDATE_ACTOR_COMBAT_BINDINGS),
    },
    visual: {
      width: pixels.width,
      height: pixels.height,
      pixelSha256: await sha256BytesHex(new Uint8Array(pixels.rgba)),
      statesPerActor: 2,
      stateCount: actors.length * 2,
    },
    checks,
    actors,
  };
};

const drawChecker = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  context.fillStyle = "#0b1016";
  context.fillRect(x, y, width, height);
  for (let py = y; py < y + height; py += 12) {
    for (let px = x; px < x + width; px += 12) {
      context.fillStyle =
        ((px - x) / 12 + (py - y) / 12) % 2 ? "#121923" : "#0f151d";
      context.fillRect(px, py, 12, 12);
    }
  }
};

const drawMarker = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) => {
  context.fillStyle = "#080b0f";
  context.fillRect(x - 6, y - 2, 13, 5);
  context.fillRect(x - 2, y - 6, 5, 13);
  context.fillStyle = color;
  context.fillRect(x - 6, y, 13, 2);
  context.fillRect(x, y - 6, 2, 13);
};

const drawEvidenceState = (
  context: CanvasRenderingContext2D,
  candidate: SocketReviewCandidate,
  sheet: HTMLImageElement,
  frame: number,
  x: number,
  y: number,
  label: string,
  color: string,
) => {
  const size = SOCKET_EVIDENCE_LAYOUT.renderedFrameSize;
  drawChecker(context, x, y, size, size);
  context.imageSmoothingEnabled = false;
  context.drawImage(
    sheet,
    frame * 64,
    candidate.sourceRow * 64,
    64,
    64,
    x,
    y,
    size,
    size,
  );
  const point = pointFor(candidate, frame);
  drawMarker(context, x + point[0] * 4, y + point[1] * 4, color);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(x - 1, y - 1, size + 2, size + 2);
  context.fillStyle = color;
  context.font = "700 9px Consolas, monospace";
  context.fillText(label, x, y - 8);
};

export const renderSocketEvidenceSheet = (
  canvas: HTMLCanvasElement,
  sheets: SpriteForgeSheetSet,
): ImageData => {
  const layout = SOCKET_EVIDENCE_LAYOUT;
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  context.imageSmoothingEnabled = false;
  context.fillStyle = "#090d12";
  context.fillRect(0, 0, canvas.width, canvas.height);

  SOCKET_REVIEW_CANDIDATES.forEach((candidate, index) => {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const cardX = layout.margin + column * (layout.cardWidth + layout.gap);
    const cardY = layout.margin + row * (layout.cardHeight + layout.gap);
    context.fillStyle = "#151c25";
    context.fillRect(cardX, cardY, layout.cardWidth, layout.cardHeight);
    context.strokeStyle = "#33404d";
    context.lineWidth = 1;
    context.strokeRect(cardX + 0.5, cardY + 0.5, layout.cardWidth - 1, layout.cardHeight - 1);

    const binding =
      CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
        candidate.direction
      ]![candidate.sequence]!;
    const prefireFrame = binding.events["prefire.begin"]!;
    const releaseFrame = binding.events[candidate.releaseEvent]!;

    context.fillStyle = "#e8edf0";
    context.font = "700 12px Consolas, monospace";
    context.fillText(
      SPRITE_FORGE_ACTORS[candidate.actorId].label.toUpperCase(),
      cardX + 14,
      cardY + 18,
    );
    context.fillStyle = "#f7c86a";
    context.font = "700 7px Consolas, monospace";
    context.fillText("CANDIDATE", cardX + 238, cardY + 17);

    drawEvidenceState(
      context,
      candidate,
      sheets[candidate.actorId],
      prefireFrame,
      cardX + 14,
      cardY + 42,
      `PREFIRE F${prefireFrame}`,
      "#71e1db",
    );
    drawEvidenceState(
      context,
      candidate,
      sheets[candidate.actorId],
      releaseFrame,
      cardX + 158,
      cardY + 42,
      `RELEASE F${releaseFrame}`,
      "#f7c86a",
    );

    const prefirePoint = pointFor(candidate, prefireFrame);
    const releasePoint = pointFor(candidate, releaseFrame);
    context.fillStyle = "#9da9b2";
    context.font = "8px Consolas, monospace";
    context.fillText(
      `${candidate.mainSocket}  [${prefirePoint.join(",")}] → [${releasePoint.join(",")}]`,
      cardX + 14,
      cardY + 187,
    );
    context.fillStyle = "#74818d";
    context.font = "7px Consolas, monospace";
    context.fillText(
      `${candidate.sequence}-down · row ${candidate.sourceRow} · ${BINDING_PREVIEW_EFFECTS[candidate.actorId]}`,
      cardX + 14,
      cardY + 204,
    );
    context.fillText(
      `${candidate.releaseEvent}@F${releaseFrame} · logical 32px cell`,
      cardX + 14,
      cardY + 218,
    );
  });

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const serializeSocketEvidenceReport = (
  report: SocketEvidenceReport,
): string =>
  `${JSON.stringify(JSON.parse(canonicalJson(report)), null, 2)}\n`;
