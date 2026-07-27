import { AUDIO_ROSTER } from "../content/audio";
import { PROXY_ACTOR_BINDINGS } from "../content/bindings";
import { INTERNAL_SLICE_RECIPES } from "../content/recipes";
import type { EffectPack, EffectRecipe } from "../model/types";
import { canonicalJson, sha256Hex } from "./canonical";

export interface PortablePack {
  manifest: EffectPack;
  recipes: EffectRecipe[];
}

export const compilePortablePack = async (
  recipes = INTERNAL_SLICE_RECIPES,
): Promise<PortablePack> => {
  const sortedRecipes = [...recipes].sort((a, b) => a.id.localeCompare(b.id));
  const recipeHashes: Record<string, string> = {};
  for (const entry of sortedRecipes) recipeHashes[entry.id] = await sha256Hex(entry);
  return {
    manifest: {
      forge: "tileforge-effect-forge",
      forgeVersion: "0.1.0",
      schemaVersion: "0.1.0",
      contentVersion: "0.1.0",
      pixelsPerTile: 16,
      effectIds: sortedRecipes.map((entry) => entry.id),
      recipeHashes,
      actorBindings: PROXY_ACTOR_BINDINGS,
      audioRoster: AUDIO_ROSTER,
    },
    recipes: sortedRecipes,
  };
};

export const serializePortablePack = (pack: PortablePack): string =>
  canonicalJson(pack);

export const parsePortablePack = (source: string): PortablePack => {
  const value = JSON.parse(source) as PortablePack;
  if (value?.manifest?.forge !== "tileforge-effect-forge" || !Array.isArray(value.recipes)) {
    throw new Error("This file is not a TileForge Effect Forge portable pack.");
  }
  return value;
};

export const downloadText = (
  filename: string,
  text: string,
  type = "application/json",
): void => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
