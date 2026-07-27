import type { SpriteForgeActorId } from "../fixtures/sprite-forge-full/assets";
import { SPRITE_FORGE_MANIFEST_SHA256 } from "../fixtures/sprite-forge-full/assets";
import type { ActorCombatBindings, ActorSocketFrame } from "../model/types";

export type ReviewSocketKind = "hand" | "weaponTip" | "castOrigin" | "head";
export type ReviewSequence = "attack" | "cast";

export interface SocketReviewCandidate {
  actorId: SpriteForgeActorId;
  label: string;
  sequence: ReviewSequence;
  direction: "down";
  sourceRow: number;
  frameCount: number;
  releaseEvent: "attack.release" | "cast.release";
  releaseFrame: number;
  mainSocket: ReviewSocketKind;
  frames: ActorSocketFrame[];
}

const anchors = (
  mainSocket: ReviewSocketKind,
  points: Array<[number, number]>,
  hurtCenter: [number, number] = [16, 15],
  groundOrigin: [number, number] = [16, 27],
): ActorSocketFrame[] =>
  points.map((point) => ({
    [mainSocket]: point,
    hurtCenter,
    groundOrigin,
  }));

/**
 * Review candidates, not recorded approvals.
 *
 * Coordinates use the logical 32 x 32 actor cell even though the supplied
 * Sprite Forge sheets are exported at x2 scale (64 x 64 source cells).
 */
export const SOCKET_REVIEW_CANDIDATES: SocketReviewCandidate[] = [
  {
    actorId: "ranger",
    label: "Ranger bow release",
    sequence: "attack",
    direction: "down",
    sourceRow: 8,
    frameCount: 3,
    releaseEvent: "attack.release",
    releaseFrame: 2,
    mainSocket: "weaponTip",
    frames: anchors("weaponTip", [[10, 17], [10, 15], [10, 16]]),
  },
  {
    actorId: "warlock",
    label: "Warlock cast release",
    sequence: "cast",
    direction: "down",
    sourceRow: 12,
    frameCount: 3,
    releaseEvent: "cast.release",
    releaseFrame: 1,
    mainSocket: "castOrigin",
    frames: anchors("castOrigin", [[9, 14], [9, 12], [9, 14]]),
  },
  {
    actorId: "skeleton",
    label: "Skeleton strike release",
    sequence: "attack",
    direction: "down",
    sourceRow: 8,
    frameCount: 3,
    releaseEvent: "attack.release",
    releaseFrame: 2,
    mainSocket: "hand",
    frames: anchors("hand", [[10, 18], [10, 16], [10, 18]]),
  },
  {
    actorId: "cultist",
    label: "Cultist cast release",
    sequence: "cast",
    direction: "down",
    sourceRow: 12,
    frameCount: 2,
    releaseEvent: "cast.release",
    releaseFrame: 1,
    mainSocket: "castOrigin",
    frames: anchors("castOrigin", [[15, 13], [15, 13]]),
  },
  {
    actorId: "corruptrobe",
    label: "Corrupt robe cast release",
    sequence: "cast",
    direction: "down",
    sourceRow: 12,
    frameCount: 3,
    releaseEvent: "cast.release",
    releaseFrame: 1,
    mainSocket: "castOrigin",
    frames: anchors("castOrigin", [[16, 5], [16, 4], [16, 5]]),
  },
  {
    actorId: "timberwolf",
    label: "Timber wolf bite release",
    sequence: "attack",
    direction: "down",
    sourceRow: 8,
    frameCount: 2,
    releaseEvent: "attack.release",
    releaseFrame: 1,
    mainSocket: "head",
    frames: anchors("head", [[9, 22], [9, 24]], [16, 25], [16, 29]),
  },
];

export const SOCKET_REVIEW_STATUS = {
  state: "candidate",
  approved: 0,
  total: SOCKET_REVIEW_CANDIDATES.length,
} as const;

export const buildCandidateBindings = (
  candidates: SocketReviewCandidate[] = SOCKET_REVIEW_CANDIDATES,
): ActorCombatBindings => {
  const actors: ActorCombatBindings["actors"] = {};
  for (const candidate of candidates) {
    actors[candidate.actorId] = {
      [candidate.direction]: {
        [candidate.sequence]: {
          events: {
            "prefire.begin": Math.max(0, candidate.releaseFrame - 1),
            [candidate.releaseEvent]: candidate.releaseFrame,
          },
          frames: candidate.frames.map((frame) => ({ ...frame })),
        },
      },
    };
  }
  return {
    actorPackHash: SPRITE_FORGE_MANIFEST_SHA256,
    actors,
  };
};

export const CANDIDATE_ACTOR_COMBAT_BINDINGS = buildCandidateBindings();
