import { useEffect, useRef, useState } from "react";
import {
  APPROVED_HOSTILE_RAMP,
  HOSTILE_RAMP_CANDIDATES,
  PALETTES,
  type HostileRampId,
} from "../families/palettes";
import {
  GRAMMAR_PROJECTILES,
  renderGrammarStrip,
} from "../grammar/board";
import { BACKGROUND_LABELS } from "../lab/backgrounds";
import type { BackgroundId } from "../model/types";

interface GrammarCanvasProps {
  background: BackgroundId;
  paletteId: HostileRampId;
  grayscale: boolean;
}

function GrammarCanvas({ background, paletteId, grayscale }: GrammarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderGrammarStrip(canvasRef.current, background, paletteId, grayscale);
    }
  }, [background, grayscale, paletteId]);

  return (
    <div className="grammar-strip">
      <span>{grayscale ? "Greyscale truth" : "Color read"}</span>
      <canvas
        ref={canvasRef}
        width={360}
        height={96}
        aria-label={`${BACKGROUND_LABELS[background]} ${grayscale ? "greyscale" : "color"} projectile grammar`}
      />
    </div>
  );
}

export function GrammarBoard() {
  const [paletteId, setPaletteId] =
    useState<HostileRampId>(APPROVED_HOSTILE_RAMP.id);
  const selected =
    HOSTILE_RAMP_CANDIDATES.find((candidate) => candidate.id === paletteId) ??
    HOSTILE_RAMP_CANDIDATES[0];
  const palette = PALETTES[selected.id]!;
  const backgrounds = Object.keys(BACKGROUND_LABELS) as BackgroundId[];

  return (
    <section className="grammar-layout" aria-label="Visual Grammar Board">
      <div className="panel grammar-hero">
        <div>
          <p className="eyebrow">
            Visual gate approved · B recorded {APPROVED_HOSTILE_RAMP.approvedOn}
          </p>
          <h2>Seven-shape projectile grammar</h2>
          <p>
            Vermilion Flare is locked for hostile identity. The comparison remains
            available as review history across every stress condition.
          </p>
        </div>
        <div className="palette-candidates" aria-label="Hostile ramp candidates">
          {HOSTILE_RAMP_CANDIDATES.map((candidate) => {
            const candidatePalette = PALETTES[candidate.id]!;
            return (
              <button
                key={candidate.id}
                className={paletteId === candidate.id ? "active" : ""}
                data-approved={candidate.key === APPROVED_HOSTILE_RAMP.key}
                onClick={() => setPaletteId(candidate.id)}
              >
                <b>{candidate.key}</b>
                <span className="candidate-swatches">
                  <i style={{ background: candidatePalette.ink }} />
                  <i style={{ background: candidatePalette.body }} />
                  <i style={{ background: candidatePalette.core }} />
                </span>
                <span>
                  <strong>{candidate.label}</strong>
                  <small>{candidate.note}</small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="preview-choice">
          <span>Inspecting</span>
          <strong>{selected.key} · {selected.label}</strong>
          <small>
            B is canonical. Selecting A or C only previews the comparison history.
          </small>
        </div>
      </div>

      <main className="panel grammar-matrix">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Five stress conditions · synchronized comparison</p>
            <h2>Color and greyscale matrix</h2>
          </div>
          <div className="swatches grammar-swatches">
            {[palette.ink, palette.body, palette.core].map((color) => (
              <span style={{ background: color }} title={color} key={color} />
            ))}
          </div>
        </div>
        <div className="background-grid">
          {backgrounds.map((background) => (
            <article className="background-card" key={background}>
              <div className="background-title">
                <strong>{BACKGROUND_LABELS[background]}</strong>
                <small>{background === "snow" ? "light extreme" : background === "dungeon" ? "dark extreme" : "stress fixture"}</small>
              </div>
              <GrammarCanvas
                background={background}
                paletteId={paletteId}
                grayscale={false}
              />
              <GrammarCanvas
                background={background}
                paletteId={paletteId}
                grayscale
              />
            </article>
          ))}
        </div>
      </main>

      <aside className="panel grammar-guide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Legend-free goal</p>
            <h2>Shape contract</h2>
          </div>
          <span className="count-badge">7 roles</span>
        </div>
        <div className="shape-list">
          {GRAMMAR_PROJECTILES.map((item, index) => (
            <div key={item.id}>
              <span className={`role-index ${item.allegiance}`}>{index + 1}</span>
              <span>
                <strong>{item.short}</strong>
                <small>{item.id}</small>
              </span>
              <em>{item.allegiance}</em>
            </div>
          ))}
        </div>
        <div className="review-checkpoints">
          <h3>Approval checkpoints</h3>
          <ul className="check-list">
            <li><span>1</span>Dark ink remains visible on snow</li>
            <li><span>2</span>Hot core survives the dungeon</li>
            <li><span>3</span>Pellet cannot read as hostile needle</li>
            <li><span>4</span>Orb, crescent, and shard separate in grey</li>
            <li><span>5</span>Player mass stays subordinate</li>
          </ul>
        </div>
        <div className="decision-card approved">
          <p className="eyebrow">Decision recorded</p>
          <strong>B · Vermilion flare</strong>
          <p>
            Canonical hostile ink, body, core, and echo are now locked across the
            Tier 1 pack.
          </p>
        </div>
      </aside>
    </section>
  );
}
