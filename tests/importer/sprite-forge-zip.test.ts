// @vitest-environment node

import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  SOCKET_REVIEW_CANDIDATES,
  type SocketReviewCandidate,
} from "../../src/content/socket-review";
import {
  SpriteForgeZipError,
  parseSpriteForgeZip,
} from "../../src/importer/spriteForgeZip";

const pngHeader = (width: number, height: number): Uint8Array => {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes.set([73, 72, 68, 82], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
};

const rowsFor = (candidate: SocketReviewCandidate) => {
  const rowCount = Math.max(13, candidate.sourceRow + 1);
  return Array.from({ length: rowCount }, (_, index) => ({
    label:
      index === candidate.sourceRow
        ? `${candidate.sequence}-${candidate.direction}`
        : `fixture-${index}`,
    frames: index === candidate.sourceRow ? candidate.frameCount : 1,
  }));
};

const fixtureArchive = (
  options: {
    prefix?: string;
    omitActor?: string;
    wrongDimensionsFor?: string;
    wrongRowFor?: string;
    secondManifest?: boolean;
  } = {},
): Uint8Array => {
  const prefix = options.prefix ? `${options.prefix.replace(/\/$/, "")}/` : "";
  const actors = SOCKET_REVIEW_CANDIDATES.filter(
    (candidate) => candidate.actorId !== options.omitActor,
  ).map((candidate) => {
    const rows = rowsFor(candidate);
    if (candidate.actorId === options.wrongRowFor) {
      rows[candidate.sourceRow]!.label = "idle-down";
    }
    return {
      id: candidate.actorId,
      name: candidate.label,
      category: "fixtures",
      cell: 32,
      scale: 2,
      sheet: `actors/${candidate.actorId}.png`,
      rows,
      flags: { rig: "fixture" },
    };
  });
  const manifest = {
    pack: "Sprite Forge importer fixture",
    generated: "stable",
    theme: "forest",
    scale: 2,
    counts: { actors: actors.length },
    actors,
  };
  const entries: Record<string, Uint8Array> = {
    [`${prefix}manifest.json`]: strToU8(JSON.stringify(manifest)),
  };
  for (const actor of actors) {
    const maxFrames = Math.max(...actor.rows.map((row) => row.frames));
    const width =
      actor.id === options.wrongDimensionsFor ? 64 : maxFrames * 32 * actor.scale;
    const height = actor.rows.length * 32 * actor.scale;
    entries[`${prefix}${actor.sheet}`] = pngHeader(width, height);
  }
  if (options.secondManifest) {
    entries["other/manifest.json"] = strToU8(JSON.stringify(manifest));
  }
  return zipSync(entries, { level: 0 });
};

describe("Sprite Forge ZIP importer", () => {
  it("loads a rooted, structurally compatible six-actor pack", async () => {
    const pack = await parseSpriteForgeZip(
      fixtureArchive({ prefix: "sprite-pack" }),
      "fixture.zip",
    );

    expect(pack.fileName).toBe("fixture.zip");
    expect(pack.manifestPath).toBe("sprite-pack/manifest.json");
    expect(pack.actorCount).toBe(6);
    expect(pack.entryCount).toBe(7);
    expect(pack.matchesEmbeddedManifest).toBe(false);
    expect(pack.theme).toBe("forest");
    expect(pack.actors.ranger.sheetPath).toBe(
      "sprite-pack/actors/ranger.png",
    );
    expect(pack.actors.ranger).toMatchObject({
      width: 192,
      height: 832,
    });
  });

  it("rejects missing representative actors", async () => {
    await expect(
      parseSpriteForgeZip(fixtureArchive({ omitActor: "timberwolf" })),
    ).rejects.toThrow("missing required representative actor: timberwolf");
  });

  it("rejects sheets whose dimensions disagree with the manifest", async () => {
    await expect(
      parseSpriteForgeZip(
        fixtureArchive({ wrongDimensionsFor: "ranger" }),
      ),
    ).rejects.toThrow("ranger sheet is 64x832; expected 192x832");
  });

  it("rejects actor rows that cannot drive the candidate binding preview", async () => {
    await expect(
      parseSpriteForgeZip(fixtureArchive({ wrongRowFor: "cultist" })),
    ).rejects.toThrow("cultist does not match the required cast-down row contract");
  });

  it("rejects ambiguous manifests and unsafe paths", async () => {
    await expect(
      parseSpriteForgeZip(fixtureArchive({ secondManifest: true })),
    ).rejects.toThrow("multiple manifest.json");

    const unsafe = zipSync({
      "../manifest.json": strToU8("{}"),
    });
    await expect(parseSpriteForgeZip(unsafe)).rejects.toBeInstanceOf(
      SpriteForgeZipError,
    );
    await expect(parseSpriteForgeZip(unsafe)).rejects.toThrow(
      "ZIP path escapes its root",
    );
  });
});
