import { describe, expect, it } from "vitest";
import {
  CANDIDATE_ACTOR_COMBAT_BINDINGS,
  SOCKET_REVIEW_CANDIDATES,
  SOCKET_REVIEW_STATUS,
  buildCandidateBindings,
} from "../../src/content/socket-review";
import {
  SPRITE_FORGE_ACTORS,
  SPRITE_FORGE_MANIFEST_SHA256,
} from "../../src/fixtures/sprite-forge-full/assets";
import spriteManifest from "../../src/fixtures/sprite-forge-full/manifest.json";
import { compilePortablePack } from "../../src/exporter/pack";
import { validatePack } from "../../src/validation/validate";

describe("six-actor socket and release candidates", () => {
  it("matches each candidate to an exact supplied animation row", () => {
    expect(SOCKET_REVIEW_CANDIDATES).toHaveLength(6);
    expect(new Set(SOCKET_REVIEW_CANDIDATES.map((entry) => entry.actorId)).size).toBe(6);
    expect(
      new Set(SOCKET_REVIEW_CANDIDATES.map((entry) => entry.actorId)),
    ).toEqual(new Set(Object.keys(SPRITE_FORGE_ACTORS)));

    for (const candidate of SOCKET_REVIEW_CANDIDATES) {
      const actor = spriteManifest.actors.find(
        (entry) => entry.id === candidate.actorId,
      );
      expect(actor, candidate.actorId).toBeDefined();
      const row = actor!.rows[candidate.sourceRow]!;
      expect(row.label).toBe(`${candidate.sequence}-${candidate.direction}`);
      expect(row.frames).toBe(candidate.frameCount);
      expect(candidate.frames).toHaveLength(candidate.frameCount);
    }
  });

  it("keeps events and logical-cell coordinates inside their contracts", () => {
    for (const candidate of SOCKET_REVIEW_CANDIDATES) {
      expect(candidate.releaseFrame).toBeGreaterThanOrEqual(0);
      expect(candidate.releaseFrame).toBeLessThan(candidate.frameCount);
      for (const frame of candidate.frames) {
        expect(frame[candidate.mainSocket]).toBeDefined();
        expect(frame.hurtCenter).toBeDefined();
        expect(frame.groundOrigin).toBeDefined();
        for (const point of Object.values(frame)) {
          expect(point).toHaveLength(2);
          for (const axis of point!) {
            expect(Number.isInteger(axis)).toBe(true);
            expect(axis).toBeGreaterThanOrEqual(0);
            expect(axis).toBeLessThanOrEqual(31);
          }
        }
      }
    }
  });

  it("keeps primary release sockets on the visually audited emission points", () => {
    const releaseSockets = Object.fromEntries(
      SOCKET_REVIEW_CANDIDATES.map((candidate) => [
        candidate.actorId,
        candidate.frames[candidate.releaseFrame]![candidate.mainSocket],
      ]),
    );

    expect(releaseSockets).toEqual({
      ranger: [10, 16],
      warlock: [9, 12],
      skeleton: [10, 18],
      cultist: [15, 13],
      corruptrobe: [16, 4],
      timberwolf: [9, 24],
    });
  });

  it("compiles deterministic companion bindings without recording approval", () => {
    expect(SOCKET_REVIEW_STATUS).toEqual({
      state: "candidate",
      approved: 0,
      total: 6,
    });
    expect(buildCandidateBindings()).toEqual(CANDIDATE_ACTOR_COMBAT_BINDINGS);
    expect(CANDIDATE_ACTOR_COMBAT_BINDINGS.actorPackHash).toBe(
      SPRITE_FORGE_MANIFEST_SHA256,
    );

    for (const candidate of SOCKET_REVIEW_CANDIDATES) {
      const binding =
        CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
          candidate.direction
        ]![candidate.sequence]!;
      expect(binding.events[candidate.releaseEvent]).toBe(
        candidate.releaseFrame,
      );
      expect(binding.events["prefire.begin"]).toBe(
        Math.max(0, candidate.releaseFrame - 1),
      );
    }
  });

  it("keeps the candidate bindings valid inside the portable pack", async () => {
    const pack = await compilePortablePack();
    const validation = validatePack(pack.manifest);
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
  });
});
