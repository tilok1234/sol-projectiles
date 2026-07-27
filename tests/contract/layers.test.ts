import { describe, expect, it } from "vitest";
import { WORLD_LAYERS } from "../../src/model/layers";

describe("named world-layer contract", () => {
  it("matches the frozen layer order", () => {
    expect(WORLD_LAYERS.map(({ order, id }) => [order, id])).toEqual([
      [0, "FLOOR"],
      [100, "DECAL"],
      [180, "GROUND_TELEGRAPH"],
      [200, "ACTIVE_HAZARD"],
      [300, "CORPSE_LOOT"],
      [400, "ACTOR"],
      [450, "ACTOR_FEEDBACK"],
      [500, "PLAYER_PROJECTILE"],
      [550, "COMBAT_TEXT"],
      [600, "HOSTILE_PROJECTILE"],
    ]);
  });
});
