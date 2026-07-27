import { useEffect, useMemo, useState } from "react";
import { INTERNAL_SLICE_RECIPES } from "../content/recipes";
import { PALETTES } from "../families/palettes";
import type { EffectRecipe } from "../model/types";
import { shortStableId } from "../exporter/canonical";
import { validateRecipe } from "../validation/validate";
import { EffectPreview } from "./EffectPreview";

interface EffectAuthorProps {
  selectedId: string;
  onSelectedId: (id: string) => void;
}

export function EffectAuthor({ selectedId, onSelectedId }: EffectAuthorProps) {
  const selected =
    INTERNAL_SLICE_RECIPES.find((entry) => entry.id === selectedId) ??
    INTERNAL_SLICE_RECIPES[0]!;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [grayscale, setGrayscale] = useState(false);
  const [grid, setGrid] = useState(true);
  const [showBounds, setShowBounds] = useState(true);
  const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    setFrame(0);
  }, [selectedId]);

  useEffect(() => {
    if (!playing || selected.animation.frames <= 1) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % selected.animation.frames);
    }, selected.animation.frameMs);
    return () => window.clearInterval(timer);
  }, [playing, selected.animation.frameMs, selected.animation.frames]);

  const validation = useMemo(() => validateRecipe(selected), [selected]);
  const palette = PALETTES[selected.render.treatment]!;
  const canonicalId = shortStableId(selected);
  const isGroundState = selected.class === "telegraph" || selected.class === "zone";

  return (
    <section className="workspace-grid author-grid" aria-label="Effect Author">
      <aside className="panel effect-browser">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Internal slice</p>
            <h2>Effects</h2>
          </div>
          <span className="count-badge">{INTERNAL_SLICE_RECIPES.length}</span>
        </div>
        <div className="effect-list">
          {INTERNAL_SLICE_RECIPES.map((entry) => (
            <button
              className={`effect-row ${entry.id === selected.id ? "active" : ""}`}
              key={entry.id}
              onClick={() => onSelectedId(entry.id)}
            >
              <span className={`role-dot ${entry.allegiance}`} />
              <span>
                <strong>{entry.id.split(".")[1]}</strong>
                <small>
                  {entry.class} · {entry.frame.w}×{entry.frame.h}
                </small>
              </span>
              <span className="mini-layer">{entry.worldLayer.replaceAll("_", " ")}</span>
            </button>
          ))}
        </div>
        <div className="panel-note">
          <span className="note-mark">i</span>
          This roster proves the architecture. Four Tier 1 entries remain planned.
        </div>
      </aside>

      <main className="panel preview-panel">
        <div className="panel-heading preview-heading">
          <div>
            <p className="eyebrow">Effect Author</p>
            <h2>{selected.id}</h2>
          </div>
          <div className="inline-actions">
            <button
              className={`icon-button ${grid ? "active" : ""}`}
              title="Toggle pixel grid"
              onClick={() => setGrid((value) => !value)}
            >
              Grid
            </button>
            <button
              className={`icon-button ${showBounds ? "active" : ""}`}
              title="Toggle occupied bounds and pivot"
              onClick={() => setShowBounds((value) => !value)}
            >
              Truth
            </button>
            <button
              className={`icon-button ${grayscale ? "active" : ""}`}
              title="Toggle greyscale"
              onClick={() => setGrayscale((value) => !value)}
            >
              Grey
            </button>
          </div>
        </div>

        <div className="preview-stage">
          <EffectPreview
            recipe={selected}
            frame={frame}
            grayscale={grayscale}
            grid={grid}
            showBounds={showBounds}
            progress={progress}
          />
          <div className="preview-legend">
            <span><i className="legend-line bounds" /> occupied bounds</span>
            <span><i className="legend-line pivot" /> pivot</span>
            <span>{selected.frame.w}×{selected.frame.h}px · nearest</span>
          </div>
        </div>

        <div className="timeline">
          <div className="timeline-controls">
            <button className="play-button" onClick={() => setPlaying((value) => !value)}>
              {playing ? "Pause" : "Play"}
            </button>
            <div>
              <strong>Frame {frame + 1}</strong>
              <small>
                {selected.animation.frameMs}ms · {selected.animation.loop ? "loop" : "once"}
              </small>
            </div>
          </div>
          <input
            aria-label="Animation frame"
            type="range"
            min={0}
            max={selected.animation.frames - 1}
            value={frame}
            onChange={(event) => {
              setPlaying(false);
              setFrame(Number(event.target.value));
            }}
          />
          <div className="frame-ticks">
            {Array.from({ length: selected.animation.frames }, (_, index) => (
              <button
                key={index}
                className={index === frame ? "active" : ""}
                onClick={() => {
                  setPlaying(false);
                  setFrame(index);
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          {isGroundState && (
            <label className="progress-control">
              <span>Truth-fill progress <strong>{Math.round(progress * 100)}%</strong></span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
              />
            </label>
          )}
        </div>

        <div className="operation-strip">
          <span>Operation stack</span>
          <b>{selected.render.silhouette}</b>
          <i>→</i>
          <b>1px outline</b>
          <i>→</i>
          <b>{selected.render.treatment}</b>
        </div>
      </main>

      <aside className="panel inspector">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Contract inspector</p>
            <h2>Semantic truth</h2>
          </div>
          <span className={`status-dot ${validation.valid ? "pass" : "fail"}`}>
            {validation.valid ? "valid" : "invalid"}
          </span>
        </div>

        <div className="inspector-section">
          <h3>Identity</h3>
          <dl className="contract-grid">
            <div><dt>Class</dt><dd>{selected.class}</dd></div>
            <div><dt>Allegiance</dt><dd>{selected.allegiance}</dd></div>
            <div><dt>Role</dt><dd>{selected.role}</dd></div>
            <div><dt>Danger</dt><dd>{selected.danger}</dd></div>
            <div><dt>Material</dt><dd>{selected.material}</dd></div>
            <div><dt>Layer</dt><dd>{selected.worldLayer}</dd></div>
          </dl>
        </div>

        <div className="inspector-section">
          <h3>Family lock</h3>
          <div className="family-card">
            <div className="swatches">
              {[palette.ink, palette.body, palette.core].map((color) => (
                <span key={color} style={{ background: color }} title={color} />
              ))}
            </div>
            <div>
              <strong>{palette.label}</strong>
              <small>{palette.status} ramp · identity locked</small>
            </div>
          </div>
        </div>

        <div className="inspector-section">
          <h3>Validation</h3>
          <ul className="check-list">
            {validation.checks.map((check) => (
              <li key={check.label} className={check.passed ? "pass" : "fail"}>
                <span>{check.passed ? "✓" : "!"}</span>
                {check.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="inspector-section audio-contract">
          <h3>Named audio sibling</h3>
          <code>{selected.audio[0]?.id}</code>
          <small>{selected.audio[0]?.stackPolicy} · {selected.audio[0]?.cooldownMs}ms</small>
        </div>

        <details className="json-details">
          <summary>Live recipe JSON <span>{canonicalId}</span></summary>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
        </details>
      </aside>
    </section>
  );
}
