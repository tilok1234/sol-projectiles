import { describe, expect, it } from "vitest";
import { INTERNAL_SLICE_RECIPES } from "../../src/content/recipes";
import { canonicalJson, sha256Hex } from "../../src/exporter/canonical";
import {
  compilePortablePack,
  parsePortablePack,
  serializePortablePack,
} from "../../src/exporter/pack";
import { validatePack } from "../../src/validation/validate";

describe("canonical pack export", () => {
  it("excludes editor state and generation timestamps from recipe hashes", async () => {
    const base = INTERNAL_SLICE_RECIPES[0]!;
    const changed = {
      ...base,
      editor: { selectedTool: "eraser", zoom: 8 },
      generatedAt: "2099-01-01T00:00:00Z",
    };
    expect(canonicalJson(changed)).not.toContain("selectedTool");
    expect(canonicalJson(changed)).not.toContain("generatedAt");
    expect(await sha256Hex(changed)).toBe(await sha256Hex(base));
  });

  it("exports, imports, and re-exports the same bytes", async () => {
    const pack = await compilePortablePack();
    const first = serializePortablePack(pack);
    const parsed = parsePortablePack(first);
    const second = serializePortablePack(parsed);
    expect(second).toBe(first);
    expect(await sha256Hex(parsed)).toBe(await sha256Hex(pack));
    expect(validatePack(parsed.manifest).valid).toBe(true);
  });
});
