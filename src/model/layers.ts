import type { WorldLayer } from "./types";

export const WORLD_LAYERS: ReadonlyArray<{
  order: number;
  id: WorldLayer;
  label: string;
}> = [
  { order: 0, id: "FLOOR", label: "Base tiles" },
  { order: 100, id: "DECAL", label: "Floor detail" },
  { order: 180, id: "GROUND_TELEGRAPH", label: "Ground telegraphs" },
  { order: 200, id: "ACTIVE_HAZARD", label: "Active hazards" },
  { order: 300, id: "CORPSE_LOOT", label: "Corpses and loot" },
  { order: 400, id: "ACTOR", label: "Actors" },
  { order: 450, id: "ACTOR_FEEDBACK", label: "Actor feedback" },
  { order: 500, id: "PLAYER_PROJECTILE", label: "Player projectiles" },
  { order: 550, id: "COMBAT_TEXT", label: "Combat text" },
  { order: 600, id: "HOSTILE_PROJECTILE", label: "Hostile projectiles" },
] as const;

export const layerOrder = (layer: WorldLayer): number =>
  WORLD_LAYERS.find((entry) => entry.id === layer)?.order ?? -1;
