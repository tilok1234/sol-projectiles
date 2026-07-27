import { describe, expect, it } from "vitest";
import {
  CANDIDATE_ACTOR_COMBAT_BINDINGS,
  SOCKET_REVIEW_CANDIDATES,
} from "../../src/content/socket-review";
import { RECIPE_BY_ID } from "../../src/content/recipes";
import {
  BINDING_PREVIEW_EFFECTS,
  logicalSocketToWorld,
  resolveBindingPreview,
  timeForBindingFrame,
} from "../../src/lab/bindingPreview";

describe("Combat Lab candidate binding preview", () => {
  it("maps every review actor to a real Tier 1 effect recipe", () => {
    expect(Object.keys(BINDING_PREVIEW_EFFECTS)).toHaveLength(6);
    for (const candidate of SOCKET_REVIEW_CANDIDATES) {
      const effectId = BINDING_PREVIEW_EFFECTS[candidate.actorId];
      expect(RECIPE_BY_ID.has(effectId), `${candidate.actorId}: ${effectId}`).toBe(
        true,
      );
    }
  });

  it("resolves prefire and release from the exported binding object", () => {
    for (const candidate of SOCKET_REVIEW_CANDIDATES) {
      const binding =
        CANDIDATE_ACTOR_COMBAT_BINDINGS.actors[candidate.actorId]![
          candidate.direction
        ]![candidate.sequence]!;
      const prefireFrame = binding.events["prefire.begin"]!;
      const releaseFrame = binding.events[candidate.releaseEvent]!;

      const prefire = resolveBindingPreview(
        candidate.actorId,
        timeForBindingFrame(candidate.actorId, prefireFrame),
      );
      expect(prefire.actorFrame).toBe(prefireFrame);
      expect(prefire.event).toBe("prefire.begin");
      expect(prefire.isPrefire).toBe(true);
      expect(prefire.hasReleased).toBe(false);

      const release = resolveBindingPreview(
        candidate.actorId,
        timeForBindingFrame(candidate.actorId, releaseFrame),
      );
      expect(release.actorFrame).toBe(releaseFrame);
      expect(release.event).toBe(candidate.releaseEvent);
      expect(release.hasReleased).toBe(true);
      expect(release.socket).toEqual(
        binding.frames[releaseFrame]![candidate.mainSocket],
      );
    }
  });

  it("converts logical actor-cell sockets to scene coordinates", () => {
    expect(logicalSocketToWorld([16, 27], 76, 101)).toEqual([76, 101]);
    expect(logicalSocketToWorld([20, 15], 245, 101)).toEqual([249, 89]);
    expect(logicalSocketToWorld([0, 0], 245, 101)).toEqual([229, 74]);
  });

  it("keeps frame jumps deterministic and release travel monotonic", () => {
    for (const candidate of SOCKET_REVIEW_CANDIDATES) {
      for (let frame = 0; frame < candidate.frameCount; frame += 1) {
        expect(
          resolveBindingPreview(
            candidate.actorId,
            timeForBindingFrame(candidate.actorId, frame),
          ).actorFrame,
        ).toBe(frame);
      }
      const releaseStart = resolveBindingPreview(
        candidate.actorId,
        timeForBindingFrame(candidate.actorId, candidate.releaseFrame),
      );
      const end = resolveBindingPreview(candidate.actorId, 1);
      expect(end.releaseProgress).toBeGreaterThanOrEqual(
        releaseStart.releaseProgress,
      );
      expect(end.releaseProgress).toBe(1);
    }
  });
});
