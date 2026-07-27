import type { BackgroundId } from "../../model/types";
import thornhollowForest from "./flagships/thornhollow-forest-1x.png";
import corruptZoneDusk from "./scenes/corrupt-zone-dusk-1x.png";
import dungeonForest from "./scenes/dungeon-room-forest-1x.png";
import forestClearing from "./scenes/forest-clearing-forest-1x.png";
import snowfieldWinter from "./scenes/snowfield-winter-1x.png";

export interface TileForgeReferenceFixture {
  id: string;
  label: string;
  theme: "forest" | "dusk" | "winter";
  kind: "scene" | "flagship";
  source: string;
}

export type TileForgeReferenceImages = Record<BackgroundId, HTMLImageElement>;

export const TILEFORGE_REFERENCE_CORPUS = {
  generated: "2026-07-26",
  sourceCommit: "199ed7d",
  scenes: 13,
  flagships: 3,
  themes: 4,
  tileSize: 32,
} as const;

export const TILEFORGE_REFERENCE_FIXTURES: Record<
  BackgroundId,
  TileForgeReferenceFixture
> = {
  meadow: {
    id: "forest-clearing-forest",
    label: "Forest clearing · forest",
    theme: "forest",
    kind: "scene",
    source: forestClearing,
  },
  dungeon: {
    id: "dungeon-room-forest",
    label: "Dungeon room · forest",
    theme: "forest",
    kind: "scene",
    source: dungeonForest,
  },
  snow: {
    id: "snowfield-winter",
    label: "Snowfield · winter",
    theme: "winter",
    kind: "scene",
    source: snowfieldWinter,
  },
  corruption: {
    id: "corrupt-zone-dusk",
    label: "Corrupt zone · dusk",
    theme: "dusk",
    kind: "scene",
    source: corruptZoneDusk,
  },
  boss: {
    id: "thornhollow-forest",
    label: "Thornhollow flagship · forest",
    theme: "forest",
    kind: "flagship",
    source: thornhollowForest,
  },
};

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Could not load TileForge reference: ${source}`));
    image.src = source;
  });

export const loadTileForgeReferences =
  async (): Promise<TileForgeReferenceImages> => {
    const entries = await Promise.all(
      (Object.keys(TILEFORGE_REFERENCE_FIXTURES) as BackgroundId[]).map(
        async (id) =>
          [id, await loadImage(TILEFORGE_REFERENCE_FIXTURES[id].source)] as const,
      ),
    );
    return Object.fromEntries(entries) as TileForgeReferenceImages;
  };
