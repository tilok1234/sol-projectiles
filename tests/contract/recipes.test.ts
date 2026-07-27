import { describe, expect, it } from "vitest";
import { INTERNAL_SLICE_RECIPES } from "../../src/content/recipes";
import { validateRecipe } from "../../src/validation/validate";

describe("effect recipe contracts", () => {
  it("validates every internal-slice recipe", () => {
    const results = INTERNAL_SLICE_RECIPES.map((recipe) => ({
      id: recipe.id,
      result: validateRecipe(recipe),
    }));
    expect(
      results.filter(({ result }) => !result.valid),
      JSON.stringify(results, null, 2),
    ).toEqual([]);
  });

  it("keeps hostile projectile identity channels locked", () => {
    const hostileProjectiles = INTERNAL_SLICE_RECIPES.filter(
      (recipe) => recipe.allegiance === "hostile" && recipe.class === "projectile",
    );
    expect(hostileProjectiles.length).toBeGreaterThan(0);
    for (const recipe of hostileProjectiles) {
      expect(recipe.family).toBe("hostile-hot-core-v1");
      expect(recipe.render.treatment).toBe("hostile-hot-core-v1");
      expect(recipe.themePolicy).toBe("identity-locked");
    }
  });

  it("requires nearest sampling and forward vectors for rotatable effects", () => {
    for (const recipe of INTERNAL_SLICE_RECIPES) {
      if (recipe.rotation.mode === "none") continue;
      expect(recipe.rotation.sampling).toBe("nearest");
      expect(recipe.frame.forward.some((axis) => axis !== 0)).toBe(true);
    }
  });
});
