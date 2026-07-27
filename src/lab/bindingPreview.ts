import {
  CANDIDATE_ACTOR_COMBAT_BINDINGS,
  SOCKET_REVIEW_CANDIDATES,
  type ReviewSocketKind,
  type SocketReviewCandidate,
} from "../content/socket-review";
import type { SpriteForgeActorId } from "../fixtures/sprite-forge-full/assets";

export type BindingPreviewEvent =
  | "ready"
  | "prefire.begin"
  | "attack.release"
  | "cast.release"
  | "recovery";

export const BINDING_PREVIEW_EFFECTS: Record<SpriteForgeActorId, string> = {
  ranger: "player.accurate-shot",
  warlock: "player.pierce-return",
  skeleton: "hostile.radial-shard",
  cultist: "hostile.predictive-orb",
  corruptrobe: "hostile.fan-crescent",
  timberwolf: "feedback.hit-contact",
};

export interface BindingPreviewState {
  actorId: SpriteForgeActorId;
  candidate: SocketReviewCandidate;
  actorFrame: number;
  prefireFrame: number;
  releaseFrame: number;
  event: BindingPreviewEvent;
  mainSocket: ReviewSocketKind;
  socket: [number, number];
  releaseProgress: number;
  effectId: string;
  hasReleased: boolean;
  isPrefire: boolean;
}

const candidateFor = (actorId: SpriteForgeActorId): SocketReviewCandidate => {
  const candidate = SOCKET_REVIEW_CANDIDATES.find(
    (entry) => entry.actorId === actorId,
  );
  if (!candidate) throw new Error(`Missing socket-review candidate: ${actorId}`);
  return candidate;
};

export const resolveBindingPreview = (
  actorId: SpriteForgeActorId,
  time: number,
): BindingPreviewState => {
  const candidate = candidateFor(actorId);
  const binding =
    CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[actorId]![candidate.direction]![
      candidate.sequence
    ]!;
  const clampedTime = Math.max(0, Math.min(1, time));
  const actorFrame = Math.min(
    candidate.frameCount - 1,
    Math.floor(clampedTime * candidate.frameCount),
  );
  const releaseFrame = binding.events[candidate.releaseEvent]!;
  const prefireFrame = binding.events["prefire.begin"]!;
  const releaseStart = releaseFrame / candidate.frameCount;
  const releaseProgress = Math.max(
    0,
    Math.min(
      1,
      (clampedTime - releaseStart) / Math.max(0.001, 1 - releaseStart),
    ),
  );
  const isPrefire =
    actorFrame >= prefireFrame && actorFrame < releaseFrame;
  const hasReleased = actorFrame >= releaseFrame;
  const event: BindingPreviewEvent =
    actorFrame < prefireFrame
      ? "ready"
      : isPrefire
        ? "prefire.begin"
        : actorFrame === releaseFrame
          ? candidate.releaseEvent
          : "recovery";
  const socket = binding.frames[actorFrame]![candidate.mainSocket];
  if (!socket) {
    throw new Error(
      `Missing ${candidate.mainSocket} on ${actorId} frame ${actorFrame}`,
    );
  }

  return {
    actorId,
    candidate,
    actorFrame,
    prefireFrame,
    releaseFrame,
    event,
    mainSocket: candidate.mainSocket,
    socket,
    releaseProgress,
    effectId: BINDING_PREVIEW_EFFECTS[actorId],
    hasReleased,
    isPrefire,
  };
};

export const timeForBindingFrame = (
  actorId: SpriteForgeActorId,
  frame: number,
): number => {
  const candidate = candidateFor(actorId);
  const clampedFrame = Math.max(
    0,
    Math.min(candidate.frameCount - 1, Math.floor(frame)),
  );
  return Math.min(0.999, (clampedFrame + 0.04) / candidate.frameCount);
};

export const logicalSocketToWorld = (
  socket: [number, number],
  actorX: number,
  actorY: number,
): [number, number] => [
  actorX - 16 + socket[0],
  actorY - 27 + socket[1],
];
