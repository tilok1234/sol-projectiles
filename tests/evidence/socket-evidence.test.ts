import { describe, expect, it } from "vitest";
import checkedEvidenceReport from "../../evidence/socket-release-validation-report.json";
import {
  SOCKET_EVIDENCE_LAYOUT,
  buildSocketEvidenceReport,
  collectSocketEvidenceChecks,
  serializeSocketEvidenceReport,
} from "../../src/evidence/socketEvidence";
import { SPRITE_FORGE_MANIFEST_SHA256 } from "../../src/fixtures/sprite-forge-full/assets";

const evidencePixels = () => {
  const rgba = new Uint8Array(
    SOCKET_EVIDENCE_LAYOUT.width * SOCKET_EVIDENCE_LAYOUT.height * 4,
  );
  rgba[3] = 255;
  return {
    width: SOCKET_EVIDENCE_LAYOUT.width,
    height: SOCKET_EVIDENCE_LAYOUT.height,
    rgba,
  };
};

describe("socket evidence report", () => {
  it("passes every structural check without recording approval", async () => {
    const pixels = evidencePixels();
    const checks = collectSocketEvidenceChecks(pixels);
    expect(checks).toHaveLength(8);
    expect(checks.every((check) => check.passed)).toBe(true);

    const report = await buildSocketEvidenceReport(pixels);
    expect(report.valid).toBe(true);
    expect(report.status).toBe("candidate");
    expect(report.approval).toEqual({
      state: "open",
      approved: 0,
      total: 6,
    });
    expect(report.source.actorPackManifestSha256).toBe(
      SPRITE_FORGE_MANIFEST_SHA256,
    );
    expect(report.visual.statesPerActor).toBe(2);
    expect(report.visual.stateCount).toBe(12);
    expect(report.actors).toHaveLength(6);
  });

  it("binds every actor record to prefire, release, socket, and Tier 1 effect", async () => {
    const report = await buildSocketEvidenceReport(evidencePixels());
    for (const actor of report.actors) {
      expect(actor.rowLabel).toMatch(/^(attack|cast)-down$/);
      expect(actor.prefireFrame).toBeGreaterThanOrEqual(0);
      expect(actor.releaseFrame).toBeGreaterThan(actor.prefireFrame);
      expect(actor.prefireSocket).toHaveLength(2);
      expect(actor.releaseSocket).toHaveLength(2);
      expect(actor.effectId).toMatch(/^(player|hostile|feedback)\./);
    }
  });

  it("keeps pixel and binding hashes deterministic and independent", async () => {
    const pixels = evidencePixels();
    const first = await buildSocketEvidenceReport(pixels);
    const second = await buildSocketEvidenceReport(evidencePixels());
    expect(second.source.bindingSha256).toBe(first.source.bindingSha256);
    expect(second.visual.pixelSha256).toBe(first.visual.pixelSha256);

    const changed = evidencePixels();
    changed.rgba[0] = 1;
    const changedReport = await buildSocketEvidenceReport(changed);
    expect(changedReport.source.bindingSha256).toBe(
      first.source.bindingSha256,
    );
    expect(changedReport.visual.pixelSha256).not.toBe(
      first.visual.pixelSha256,
    );
  });

  it("serializes stable human-readable JSON with no generated timestamp", async () => {
    const report = await buildSocketEvidenceReport(evidencePixels());
    const first = serializeSocketEvidenceReport(report);
    const second = serializeSocketEvidenceReport(report);
    expect(second).toBe(first);
    expect(first.endsWith("\n")).toBe(true);
    expect(first).not.toContain("generatedAt");
    expect(JSON.parse(first)).toEqual(report);
  });

  it("keeps the checked-in candidate artifact explicit and self-consistent", () => {
    expect(checkedEvidenceReport).toMatchObject({
      forge: "tileforge-effect-forge",
      kind: "socket-release-review",
      status: "candidate",
      valid: true,
      approval: {
        state: "open",
        approved: 0,
        total: 6,
      },
      visual: {
        width: SOCKET_EVIDENCE_LAYOUT.width,
        height: SOCKET_EVIDENCE_LAYOUT.height,
        statesPerActor: 2,
        stateCount: 12,
      },
    });
    expect(checkedEvidenceReport.checks).toHaveLength(8);
    expect(checkedEvidenceReport.checks.every((check) => check.passed)).toBe(
      true,
    );
    expect(checkedEvidenceReport.actors).toHaveLength(6);
  });
});
