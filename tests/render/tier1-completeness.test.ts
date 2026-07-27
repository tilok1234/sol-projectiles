import { describe, expect, it } from "vitest";
import { INTERNAL_SLICE_RECIPES, RECIPE_BY_ID } from "../../src/content/recipes";
import { TIER_1_ROSTER } from "../../src/content/tier1";
import { hasBinaryAlpha, renderEffect } from "../../src/renderer/renderEffect";

const opaquePixelCount = (rgba: Uint8ClampedArray): number => {
  let count = 0;
  for (let index = 3; index < rgba.length; index += 4) {
    if (rgba[index]) count += 1;
  }
  return count;
};

describe("Tier 1 completion", () => {
  it("provides one valid renderable recipe for every roster entry", () => {
    expect(INTERNAL_SLICE_RECIPES).toHaveLength(17);
    expect(RECIPE_BY_ID.size).toBe(17);

    for (const entry of TIER_1_ROSTER) {
      const recipe = RECIPE_BY_ID.get(entry.id);
      expect(recipe, entry.id).toBeDefined();
      const frame = renderEffect(recipe!, { frame: 1, progress: 0.75 });
      expect(opaquePixelCount(frame.rgba), entry.id).toBeGreaterThan(0);
      expect(hasBinaryAlpha(frame), entry.id).toBe(true);
    }
  });

  it("keeps the new feedback local to a small actor-centered frame", () => {
    for (const id of ["feedback.kill-pop", "feedback.player-hurt"]) {
      const recipe = RECIPE_BY_ID.get(id)!;
      const frame = renderEffect(recipe, { frame: 1 });
      expect(frame.width, id).toBeLessThanOrEqual(16);
      expect(frame.height, id).toBeLessThanOrEqual(16);
      expect(opaquePixelCount(frame.rgba), id).toBeLessThan(100);
    }
  });

  it("separates ordinary and elite telegraphs in greyscale", () => {
    const ordinary = renderEffect(RECIPE_BY_ID.get("telegraph.delayed-ground")!, {
      frame: 2,
      progress: 0.5,
      grayscale: true,
    });
    const elite = renderEffect(RECIPE_BY_ID.get("telegraph.elite-cast")!, {
      frame: 2,
      progress: 0.5,
      grayscale: true,
    });
    expect(`${ordinary.width}x${ordinary.height}:${Array.from(ordinary.rgba)}`).not.toBe(
      `${elite.width}x${elite.height}:${Array.from(elite.rgba)}`,
    );
  });
});
