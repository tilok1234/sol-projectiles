import { useEffect, useRef, useState } from "react";
import {
  buildSocketEvidenceReport,
  renderSocketEvidenceSheet,
  serializeSocketEvidenceReport,
  type SocketEvidenceReport,
} from "../evidence/socketEvidence";
import { downloadText } from "../exporter/pack";
import {
  loadSpriteForgeSheets,
  type SpriteForgeSheetSet,
} from "../fixtures/sprite-forge-full/assets";
import { downloadCanvas } from "../renderer/canvas";

export function EvidenceReview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sheets, setSheets] = useState<SpriteForgeSheetSet | null>(null);
  const [report, setReport] = useState<SocketEvidenceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportState, setExportState] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadSpriteForgeSheets()
      .then((loaded) => {
        if (active) setSheets(loaded);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load Sprite Forge actor sheets.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sheets) return;
    let active = true;
    const pixels = renderSocketEvidenceSheet(canvas, sheets);
    void buildSocketEvidenceReport({
      width: pixels.width,
      height: pixels.height,
      rgba: pixels.data,
    })
      .then((compiled) => {
        if (active) setReport(compiled);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not compile socket evidence.",
        );
      });
    return () => {
      active = false;
    };
  }, [sheets]);

  const passedChecks =
    report?.checks.filter((check) => check.passed).length ?? 0;

  return (
    <section className="evidence-layout" aria-label="Socket evidence review">
      <main className="panel evidence-stage">
        <div className="evidence-heading">
          <div>
            <p className="eyebrow">Deterministic review artifact</p>
            <h1>Six-actor socket evidence</h1>
            <p>
              Prefire and release frames from the exact supplied Sprite Forge
              sheets · logical 32 px coordinates
            </p>
          </div>
          <span className="candidate-pill">Candidate · 0/6 approved</span>
        </div>
        <div className="evidence-canvas-wrap">
          <canvas
            aria-label="Six actor prefire and release evidence sheet"
            className="evidence-canvas"
            data-binding-sha256={report?.source.bindingSha256 ?? ""}
            data-check-count={report?.checks.length ?? 0}
            data-evidence-valid={String(report?.valid ?? false)}
            data-pixel-sha256={report?.visual.pixelSha256 ?? ""}
            ref={canvasRef}
          />
          {!sheets && !error && <p>Loading supplied actor sheets…</p>}
          {error && <p className="evidence-error">{error}</p>}
        </div>
        <div className="evidence-legend">
          <span><i className="prefire" />Prefire frame and socket</span>
          <span><i className="release" />Release frame and socket</span>
          <span>12 exact animation states · no approval inferred</span>
        </div>
      </main>

      <aside className="panel evidence-report">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Machine-readable evidence</p>
            <h2>Validation report</h2>
          </div>
          <span className={`status-dot ${report?.valid ? "pass" : ""}`}>
            {report?.valid ? "valid" : "building"}
          </span>
        </div>

        <div className="evidence-metrics">
          <div><strong>12</strong><span>review states</span></div>
          <div>
            <strong>{passedChecks}/{report?.checks.length ?? 8}</strong>
            <span>checks passed</span>
          </div>
          <div><strong>0/6</strong><span>approvals</span></div>
        </div>

        <div className="evidence-hashes">
          <div>
            <span>Binding SHA-256</span>
            <code>{report?.source.bindingSha256 ?? "building…"}</code>
          </div>
          <div>
            <span>Visual pixel SHA-256</span>
            <code>{report?.visual.pixelSha256 ?? "building…"}</code>
          </div>
        </div>

        <ul className="check-list evidence-checks">
          {(report?.checks ?? []).map((check) => (
            <li className={check.passed ? "pass" : "fail"} key={check.id}>
              <span>{check.passed ? "✓" : "!"}</span>
              <div>
                <strong>{check.label}</strong>
                <small>{check.detail}</small>
              </div>
            </li>
          ))}
        </ul>

        <div className="evidence-export">
          <button
            className="primary-button"
            disabled={!report || !canvasRef.current}
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas || !report) return;
              downloadCanvas(
                canvas,
                "socket-release-evidence-candidate.png",
              );
              downloadText(
                "socket-release-validation-report.json",
                serializeSocketEvidenceReport(report),
              );
              setExportState(
                `Exported PNG + JSON · ${report.source.bindingSha256.slice(0, 12)}`,
              );
            }}
          >
            Export evidence PNG + JSON
          </button>
          {exportState && <p>{exportState}</p>}
          <small>
            Stable filenames and hashes. The report says candidate/open until
            explicit visual approval is recorded.
          </small>
        </div>
      </aside>
    </section>
  );
}
