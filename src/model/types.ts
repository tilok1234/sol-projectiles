export type EffectClass =
  | "projectile"
  | "telegraph"
  | "feedback"
  | "zone"
  | "combat-text";

export type Allegiance = "player" | "hostile" | "neutral-support";
export type Danger = "ordinary" | "elite" | "boss";
export type Material =
  | "physical"
  | "arcane"
  | "fire"
  | "frost"
  | "corruption"
  | "neutral";
export type ThemePolicy = "identity-locked" | "accent-optional" | "fixed";
export type RotationMode = "none" | "travel-direction" | "impact-normal";
export type GeometryShape = "point" | "circle" | "rectangle" | "capsule" | "wedge";

export type WorldLayer =
  | "FLOOR"
  | "DECAL"
  | "GROUND_TELEGRAPH"
  | "ACTIVE_HAZARD"
  | "CORPSE_LOOT"
  | "ACTOR"
  | "ACTOR_FEEDBACK"
  | "PLAYER_PROJECTILE"
  | "COMBAT_TEXT"
  | "HOSTILE_PROJECTILE";

export interface AudioCue {
  id: string;
  event: string;
  spatial: boolean;
  cooldownMs: number;
  stackPolicy: "nearest-loudest" | "once-per-volley" | "coalesce" | "one-voice";
}

export interface EffectRecipe {
  forge: "tileforge-effect-forge";
  schemaVersion: "0.1.0";
  contentVersion: string;
  id: string;
  seed: string;
  class: EffectClass;
  tier: 1 | 2 | 3;
  allegiance: Allegiance;
  role: string;
  danger: Danger;
  material: Material;
  family: string;
  themePolicy: ThemePolicy;
  frame: {
    w: number;
    h: number;
    pivot: [number, number];
    forward: [number, number];
    padding: number;
  };
  animation: {
    frames: number;
    frameMs: number;
    loop: boolean;
    phasePolicy: "spawn-at-zero" | "event-controlled";
  };
  rotation: {
    mode: RotationMode;
    sampling: "nearest";
  };
  geometry: {
    shape: GeometryShape;
    radiusPx?: number;
    widthPx?: number;
    heightPx?: number;
    lengthPx?: number;
    angleDeg?: number;
  };
  render: {
    silhouette: string;
    treatment: string;
    alpha: "binary";
    blend: "normal";
  };
  worldLayer: WorldLayer;
  audio: AudioCue[];
  editor?: Record<string, unknown>;
}

export interface ActorSocketFrame {
  hand?: [number, number];
  weaponTip?: [number, number];
  castOrigin?: [number, number];
  head?: [number, number];
  hurtCenter?: [number, number];
  groundOrigin?: [number, number];
}

export interface ActorCombatBindings {
  actorPackHash: string;
  actors: Record<
    string,
    Record<
      string,
      Record<
        string,
        {
          events: Record<string, number>;
          frames: ActorSocketFrame[];
        }
      >
    >
  >;
}

export interface AudioRoster {
  version: string;
  cues: Array<{ id: string; status: "named-only" | "supplied" | "approved" }>;
}

export interface EffectPack {
  forge: "tileforge-effect-forge";
  forgeVersion: string;
  schemaVersion: "0.1.0";
  contentVersion: string;
  pixelsPerTile: number;
  effectIds: string[];
  recipeHashes: Record<string, string>;
  actorBindings: ActorCombatBindings;
  audioRoster: AudioRoster;
}

export interface PixelFrame {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  occupiedBounds: Bounds | null;
  geometryMask?: Uint8Array;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ThemeId = "forest" | "autumn" | "dusk" | "winter";
export type BackgroundId = "meadow" | "dungeon" | "snow" | "corruption" | "boss";
