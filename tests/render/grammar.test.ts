import { describe, expect, it } from "vitest";
import { RECIPE_BY_ID } from "../../src/content/recipes";
import { TIER_1_ROSTER } from "../../src/content/tier1";
import {
  HOSTILE_RAMP_CANDIDATES,
  PALETTES,
  SHARED_ACTOR_INK,
} from "../../src/families/palettes";
import { GRAMMAR_PROJECTILES } from "../../src/grammar/board";
import { renderEffect } from "../../src/renderer/renderEffect";

const alphaSignature = (id: string): string => {
  const recipe = RECIPE_BY_ID.get(id);
  if (!recipe) throw new Error(`Missing grammar recipe: ${id}`);
  const frame = renderEffect(recipe);
  const alpha: number[] = [];
  for (let index = 3; index < frame.rgba.length; index += 4) {
    alpha.push(frame.rgba[index] ? 1 : 0);
  }
  return `${frame.width}x${frame.height}:${alpha.join("")}`;
};

const alphaBytes = (rgba: Uint8ClampedArray): number[] => {
  const result: number[] = [];
  for (let index = 3; index < rgba.length; index += 4) result.push(rgba[index]!);
  return result;
};

describe("visual projectile grammar", () => {
  it("provides seven structurally distinct projectile silhouettes", () => {
    const signatures = GRAMMAR_PROJECTILES.map((entry) => alphaSignature(entry.id));
    expect(new Set(signatures).size).toBe(GRAMMAR_PROJECTILES.length);
  });

  it("keeps the shared ink locked across all hostile candidates", () => {
    for (const candidate of HOSTILE_RAMP_CANDIDATES) {
      expect(PALETTES[candidate.id]?.ink).toBe(SHARED_ACTOR_INK);
    }
  });

  it("changes hostile colors without changing projectile geometry", () => {
    const orb = RECIPE_BY_ID.get("hostile.predictive-orb")!;
    const renders = HOSTILE_RAMP_CANDIDATES.map((candidate) =>
      renderEffect(orb, { paletteId: candidate.id }),
    );
    expect(new Set(renders.map((frame) => Array.from(frame.rgba).join(","))).size).toBe(3);
    expect(alphaBytes(renders[0]!.rgba)).toEqual(alphaBytes(renders[1]!.rgba));
    expect(alphaBytes(renders[0]!.rgba)).toEqual(alphaBytes(renders[2]!.rgba));
  });

  it("moves the four new projectile recipes into the internal slice", () => {
    expect(TIER_1_ROSTER.filter((entry) => entry.status === "slice")).toHaveLength(13);
    expect(TIER_1_ROSTER.filter((entry) => entry.status === "planned")).toHaveLength(4);
  });
});
