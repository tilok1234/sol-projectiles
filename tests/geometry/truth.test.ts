import { describe, expect, it } from "vitest";
import { RECIPE_BY_ID } from "../../src/content/recipes";
import { geometryMaskFromRecipe } from "../../src/masks/primitives";
import { masksEqual, type Mask } from "../../src/masks/mask";
import { renderEffect } from "../../src/renderer/renderEffect";

const frameGeometry = (
  width: number,
  height: number,
  data: Uint8Array | undefined,
): Mask => {
  if (!data) throw new Error("Expected rendered geometry mask");
  return { width, height, data };
};

describe("telegraph and collision truth", () => {
  it("uses the same geometry raster for collision and delayed-marker rendering", () => {
    const recipe = RECIPE_BY_ID.get("telegraph.delayed-ground")!;
    const collision = geometryMaskFromRecipe(recipe);
    const rendered = renderEffect(recipe, { progress: 0.5 });
    expect(
      masksEqual(
        collision,
        frameGeometry(rendered.width, rendered.height, rendered.geometryMask),
      ),
    ).toBe(true);
  });

  it.each([
    "telegraph.chaser-lunge",
    "telegraph.elite-cast",
  ])("uses recipe geometry as the visible footprint for %s", (id) => {
    const recipe = RECIPE_BY_ID.get(id)!;
    const collision = geometryMaskFromRecipe(recipe);
    const rendered = renderEffect(recipe, { frame: 2, progress: 0.75 });
    expect(
      masksEqual(
        collision,
        frameGeometry(rendered.width, rendered.height, rendered.geometryMask),
      ),
    ).toBe(true);
  });

  it("preserves exact area but changes category at activation", () => {
    const telegraph = RECIPE_BY_ID.get("telegraph.delayed-ground")!;
    const hazard = RECIPE_BY_ID.get("zone.active-ground-hazard")!;
    const warningFrame = renderEffect(telegraph, { frame: 2, progress: 0.75 });
    const activeFrame = renderEffect(hazard, { frame: 2 });
    expect(Array.from(warningFrame.geometryMask ?? [])).toEqual(
      Array.from(activeFrame.geometryMask ?? []),
    );
    expect(Array.from(warningFrame.rgba)).not.toEqual(Array.from(activeFrame.rgba));
  });
});
