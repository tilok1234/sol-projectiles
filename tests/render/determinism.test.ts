import { describe, expect, it } from "vitest";
import { INTERNAL_SLICE_RECIPES, RECIPE_BY_ID } from "../../src/content/recipes";
import { hasBinaryAlpha, renderEffect } from "../../src/renderer/renderEffect";

describe("deterministic effect rendering", () => {
  it("renders byte-identically when repeated", () => {
    for (const recipe of INTERNAL_SLICE_RECIPES) {
      const first = renderEffect(recipe, { frame: 2, progress: 0.73 });
      const second = renderEffect(recipe, { frame: 2, progress: 0.73 });
      expect(Array.from(first.rgba), recipe.id).toEqual(Array.from(second.rgba));
    }
  });

  it("uses binary alpha for every slice frame", () => {
    for (const recipe of INTERNAL_SLICE_RECIPES) {
      for (let frame = 0; frame < recipe.animation.frames; frame += 1) {
        expect(hasBinaryAlpha(renderEffect(recipe, { frame })), recipe.id).toBe(true);
      }
    }
  });

  it("keeps the predictive orb outer mass stable while the animation advances", () => {
    const recipe = RECIPE_BY_ID.get("hostile.predictive-orb")!;
    const signatures = Array.from(
      { length: recipe.animation.frames },
      (_, frame) => renderEffect(recipe, { frame }).occupiedBounds,
    );
    expect(new Set(signatures.map((bounds) => JSON.stringify(bounds))).size).toBe(1);
  });

  it("does not render blocked feedback as a damage-number glyph", () => {
    const blocked = RECIPE_BY_ID.get("feedback.blocked-immune")!;
    expect(blocked.render.silhouette).toBe("impact.chevron");
    expect(blocked.worldLayer).toBe("ACTOR_FEEDBACK");
    expect(blocked.role).toBe("blocked");
  });
});
