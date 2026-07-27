import adventurerAutumn from "./sheets/adventurer-autumn.png";
import adventurerDusk from "./sheets/adventurer-dusk.png";
import adventurerForest from "./sheets/adventurer-forest.png";
import adventurerWinter from "./sheets/adventurer-winter.png";
import banditAutumn from "./sheets/bandit-autumn.png";
import banditDusk from "./sheets/bandit-dusk.png";
import banditForest from "./sheets/bandit-forest.png";
import banditWinter from "./sheets/bandit-winter.png";
import type { ThemeId } from "../../model/types";

export type FixtureActorId = "adventurer" | "bandit";
export type ActorSheetSet = Record<FixtureActorId, Record<ThemeId, HTMLImageElement>>;

const SOURCES: Record<FixtureActorId, Record<ThemeId, string>> = {
  adventurer: {
    forest: adventurerForest,
    autumn: adventurerAutumn,
    dusk: adventurerDusk,
    winter: adventurerWinter,
  },
  bandit: {
    forest: banditForest,
    autumn: banditAutumn,
    dusk: banditDusk,
    winter: banditWinter,
  },
};

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load Actor Forge sheet: ${source}`));
    image.src = source;
  });

export const loadActorSheets = async (): Promise<ActorSheetSet> => {
  const result = {} as ActorSheetSet;
  for (const actor of Object.keys(SOURCES) as FixtureActorId[]) {
    result[actor] = {} as Record<ThemeId, HTMLImageElement>;
    for (const theme of Object.keys(SOURCES[actor]) as ThemeId[]) {
      result[actor][theme] = await loadImage(SOURCES[actor][theme]);
    }
  }
  return result;
};
