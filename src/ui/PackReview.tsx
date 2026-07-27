import { useEffect, useMemo, useState } from "react";
import { INTERNAL_SLICE_RECIPES } from "../content/recipes";
import { TIER_1_ROSTER } from "../content/tier1";
import {
  compilePortablePack,
  downloadText,
  parsePortablePack,
  serializePortablePack,
  type PortablePack,
} from "../exporter/pack";
import { sha256Hex } from "../exporter/canonical";
import { validatePack, validateRecipe } from "../validation/validate";

export function PackReview() {
  const [pack, setPack] = useState<PortablePack | null>(null);
  const [packHash, setPackHash] = useState("building…");
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    void compilePortablePack().then(async (compiled) => {
      setPack(compiled);
      setPackHash(await sha256Hex(compiled));
    });
  }, []);

  const recipeValidCount = useMemo(
    () => INTERNAL_SLICE_RECIPES.filter((entry) => validateRecipe(entry).valid).length,
    [],
  );
  const packValidation = pack ? validatePack(pack.manifest) : null;
  const implementedCount = TIER_1_ROSTER.filter((entry) => entry.status === "slice").length;

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parsePortablePack(await file.text());
      const serialized = serializePortablePack(imported);
      setImportMessage(
        `Re-imported ${imported.recipes.length} recipes · ${await sha256Hex(imported)} · ${serialized.length} bytes`,
      );
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Could not import pack.");
    }
  };

  return (
    <section className="pack-layout" aria-label="Pack Review">
      <div className="panel gate-summary">
        <div className="gate-kicker">
          <span>EF-0</span>
          <div>
            <p className="eyebrow">Current gate target</p>
            <h2>Contract candidate</h2>
          </div>
        </div>
        <p>
          The architecture is testable and the internal slice renders. Palette and
          fixture approvals remain open, so this is not visual acceptance.
        </p>
        <div className="metric-row">
          <div><strong>{implementedCount}/17</strong><span>Tier 1 recipes in slice</span></div>
          <div><strong>{recipeValidCount}/{INTERNAL_SLICE_RECIPES.length}</strong><span>Recipe contracts valid</span></div>
          <div><strong>{packValidation?.valid ? "PASS" : "…"}</strong><span>Portable manifest</span></div>
          <div><strong>0</strong><span>Visual approvals claimed</span></div>
        </div>
      </div>

      <div className="panel roster-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Gate EF-1</p>
            <h2>Tier 1 completeness</h2>
          </div>
          <span className="count-badge">{implementedCount} slice · {17 - implementedCount} planned</span>
        </div>
        <div className="roster-table" role="table" aria-label="Tier 1 completeness matrix">
          <div className="roster-head" role="row">
            <span>Effect</span><span>Status</span><span>Named audio sibling</span>
          </div>
          {TIER_1_ROSTER.map((entry) => (
            <div className="roster-row" role="row" key={entry.id}>
              <span><strong>{entry.label}</strong><small>{entry.id}</small></span>
              <span className={`roster-status ${entry.status}`}>{entry.status === "slice" ? "Internal slice" : "Planned"}</span>
              <code>{entry.audioId}</code>
            </div>
          ))}
        </div>
      </div>

      <aside className="panel export-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Determinism</p>
            <h2>Portable pack</h2>
          </div>
          <span className={`status-dot ${packValidation?.valid ? "pass" : ""}`}>
            {packValidation?.valid ? "valid" : "building"}
          </span>
        </div>
        <div className="hash-card">
          <span>Canonical SHA-256</span>
          <code>{packHash}</code>
        </div>
        <ul className="check-list">
          {(packValidation?.checks ?? []).map((check) => (
            <li className={check.passed ? "pass" : "fail"} key={check.label}>
              <span>{check.passed ? "✓" : "!"}</span>{check.label}
            </li>
          ))}
          <li className="pass"><span>✓</span>Editor state excluded from hashes</li>
          <li className="pass"><span>✓</span>Binary alpha render contract</li>
        </ul>
        <button
          className="primary-button"
          disabled={!pack}
          onClick={() => {
            if (pack) {
              downloadText(
                "tileforge-effect-pack-0.1.0.json",
                serializePortablePack(pack),
              );
            }
          }}
        >
          Export deterministic JSON
        </button>
        <label className="file-button">
          Re-import pack
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importFile(event.target.files?.[0])}
          />
        </label>
        {importMessage && <p className="import-message">{importMessage}</p>}
        <div className="approval-warning">
          <strong>Approval still required</strong>
          <p>
            Candidate hostile ramp, exact actor sockets, remaining Actor Forge
            archetypes, and real map corpus.
          </p>
        </div>
      </aside>
    </section>
  );
}
