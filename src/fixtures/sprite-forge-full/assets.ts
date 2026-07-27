import corruptrobeSource from "./enemies/corruptrobe.png";
import cultistSource from "./enemies/cultist.png";
import skeletonSource from "./enemies/skeleton.png";
import timberwolfSource from "./enemies/timberwolf.png";
import rangerSource from "./players/ranger.png";
import warlockSource from "./players/warlock.png";

export type SpriteForgeActorId =
  | "ranger"
  | "warlock"
  | "skeleton"
  | "cultist"
  | "corruptrobe"
  | "timberwolf";

export type SpriteForgeActorSet = "skirmish" | "arcane";
export type SpriteForgeSheetSet = Record<SpriteForgeActorId, HTMLImageElement>;

export const SPRITE_FORGE_MANIFEST_SHA256 =
  "1D93D0F3D96A7C92D284891F39B90D602AE721C84742B78EBE3F598587EE1549";

export const SPRITE_FORGE_CORPUS = {
  generated: "2026-07-27",
  actors: 231,
  players: 12,
  npcs: 6,
  vendors: 4,
  enemies: 128,
  bosses: 34,
  props: 12,
  projectiles: 20,
  effects: 15,
  theme: "forest",
  scale: 2,
} as const;

export const SPRITE_FORGE_ACTORS: Record<
  SpriteForgeActorId,
  {
    label: string;
    category: "player" | "hostile";
    rig: "humanoid" | "baked";
    source: string;
  }
> = {
  ranger: {
    label: "Ranger",
    category: "player",
    rig: "humanoid",
    source: rangerSource,
  },
  warlock: {
    label: "Warlock",
    category: "player",
    rig: "humanoid",
    source: warlockSource,
  },
  skeleton: {
    label: "Skeleton",
    category: "hostile",
    rig: "humanoid",
    source: skeletonSource,
  },
  cultist: {
    label: "Cultist",
    category: "hostile",
    rig: "baked",
    source: cultistSource,
  },
  corruptrobe: {
    label: "Corrupt robe",
    category: "hostile",
    rig: "humanoid",
    source: corruptrobeSource,
  },
  timberwolf: {
    label: "Timber wolf",
    category: "hostile",
    rig: "baked",
    source: timberwolfSource,
  },
};

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Could not load Sprite Forge sheet: ${source}`));
    image.src = source;
  });

export const loadSpriteForgeSheets = async (): Promise<SpriteForgeSheetSet> => {
  const entries = await Promise.all(
    (Object.keys(SPRITE_FORGE_ACTORS) as SpriteForgeActorId[]).map(
      async (id) => [id, await loadImage(SPRITE_FORGE_ACTORS[id].source)] as const,
    ),
  );
  return Object.fromEntries(entries) as SpriteForgeSheetSet;
};
