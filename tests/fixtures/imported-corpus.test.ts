import { describe, expect, it } from "vitest";
import spriteManifest from "../../src/fixtures/sprite-forge-full/manifest.json";
import {
  SPRITE_FORGE_ACTORS,
  SPRITE_FORGE_CORPUS,
} from "../../src/fixtures/sprite-forge-full/assets";
import tileManifest from "../../src/fixtures/tileforge-reference/manifest.json";
import {
  TILEFORGE_REFERENCE_CORPUS,
  TILEFORGE_REFERENCE_FIXTURES,
} from "../../src/fixtures/tileforge-reference/assets";

describe("supplied fixture corpora", () => {
  it("keeps the complete Sprite Forge manifest and representative cast", () => {
    expect(spriteManifest.actors).toHaveLength(231);
    expect(spriteManifest.counts).toMatchObject({
      players: 12,
      npcs: 6,
      vendors: 4,
      enemies: 128,
      bosses: 34,
      props: 12,
      projectiles: 20,
      effects: 15,
    });
    expect(SPRITE_FORGE_CORPUS.actors).toBe(spriteManifest.actors.length);

    const manifestIds = new Set(spriteManifest.actors.map((actor) => actor.id));
    const representativeIds = Object.keys(SPRITE_FORGE_ACTORS);
    expect(representativeIds).toHaveLength(6);
    for (const id of representativeIds) expect(manifestIds.has(id), id).toBe(true);
  });

  it("keeps the TileForge reference manifest and five live stress fixtures", () => {
    expect(tileManifest.themes).toHaveLength(4);
    expect(tileManifest.scenes).toHaveLength(13);
    expect(tileManifest.flagships).toHaveLength(3);
    expect(tileManifest.sourceCommit.startsWith(TILEFORGE_REFERENCE_CORPUS.sourceCommit)).toBe(
      true,
    );

    const fixtures = Object.values(TILEFORGE_REFERENCE_FIXTURES);
    expect(fixtures).toHaveLength(5);
    expect(new Set(fixtures.map((entry) => entry.id)).size).toBe(5);
    expect(fixtures.filter((entry) => entry.kind === "flagship")).toHaveLength(1);
    for (const fixture of fixtures) expect(fixture.source.length).toBeGreaterThan(0);
  });
});
