import { useEffect, useRef, useState } from "react";
import {
  loadActorSheets,
  type ActorSheetSet,
} from "../fixtures/actor-pack/assets";
import {
  loadSpriteForgeSheets,
  SPRITE_FORGE_ACTORS,
  SPRITE_FORGE_CORPUS,
  type SpriteForgeActorId,
  type SpriteForgeActorSet,
  type SpriteForgeSheetSet,
} from "../fixtures/sprite-forge-full/assets";
import {
  loadTileForgeReferences,
  TILEFORGE_REFERENCE_CORPUS,
  TILEFORGE_REFERENCE_FIXTURES,
  type TileForgeReferenceImages,
} from "../fixtures/tileforge-reference/assets";
import {
  resolveBindingPreview,
  timeForBindingFrame,
} from "../lab/bindingPreview";
import { renderLabScene } from "../lab/scene";
import type { BackgroundId } from "../model/types";
import { downloadCanvas } from "../renderer/canvas";

export function CombatLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [background, setBackground] = useState<BackgroundId>("dungeon");
  const [grayscale, setGrayscale] = useState(false);
  const [hitboxTruth, setHitboxTruth] = useState(false);
  const [layerOrderMode, setLayerOrderMode] = useState(false);
  const [density, setDensity] = useState<"focus" | "slice" | "stress">("slice");
  const [time, setTime] = useState(0.5);
  const [actorSet, setActorSet] = useState<SpriteForgeActorSet>("skirmish");
  const [bindingActorId, setBindingActorId] =
    useState<SpriteForgeActorId>("cultist");
  const [bindingTruth, setBindingTruth] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [actorSheets, setActorSheets] = useState<ActorSheetSet | null>(null);
  const [spriteForgeSheets, setSpriteForgeSheets] =
    useState<SpriteForgeSheetSet | null>(null);
  const [tileForgeReferences, setTileForgeReferences] =
    useState<TileForgeReferenceImages | null>(null);
  const bindingPreview = resolveBindingPreview(bindingActorId, time);

  useEffect(() => {
    let active = true;
    void loadActorSheets().then((sheets) => {
      if (active) setActorSheets(sheets);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      loadSpriteForgeSheets(),
      loadTileForgeReferences(),
    ]).then(([sheets, references]) => {
      if (!active) return;
      setSpriteForgeSheets(sheets);
      setTileForgeReferences(references);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderLabScene(canvas, {
      background,
      grayscale,
      hitboxTruth,
      layerOrderMode,
      density,
      time,
      actorSet,
      bindingActorId,
      bindingTruth,
      actorSheets: actorSheets ?? undefined,
      spriteForgeSheets: spriteForgeSheets ?? undefined,
      tileForgeReferences: tileForgeReferences ?? undefined,
    });
  }, [
    actorSet,
    actorSheets,
    background,
    bindingActorId,
    bindingTruth,
    density,
    grayscale,
    hitboxTruth,
    layerOrderMode,
    spriteForgeSheets,
    tileForgeReferences,
    time,
  ]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTime((value) => (value + 0.025 > 1 ? 0 : value + 0.025));
    }, 45);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <section className="lab-layout" aria-label="Combat Lab">
      <div className="panel lab-main">
        <div className="panel-heading lab-heading">
          <div>
            <p className="eyebrow">
              Sprite Forge full pack · TileForge reference corpus
            </p>
            <h2>Combat Lab</h2>
          </div>
          <div className="mode-switches">
            <button
              className={grayscale ? "active" : ""}
              onClick={() => setGrayscale((value) => !value)}
            >
              Greyscale
            </button>
            <button
              className={hitboxTruth ? "active cyan" : ""}
              onClick={() => setHitboxTruth((value) => !value)}
            >
              Hitbox truth
            </button>
            <button
              className={layerOrderMode ? "active" : ""}
              onClick={() => setLayerOrderMode((value) => !value)}
            >
              Layer order
            </button>
            <button
              className={bindingTruth ? "active cyan" : ""}
              onClick={() => setBindingTruth((value) => !value)}
            >
              Binding truth
            </button>
          </div>
        </div>

        <div className="lab-canvas-shell">
          <canvas
            ref={canvasRef}
            width={320}
            height={180}
            className="lab-canvas"
            aria-label="Fixed combat readability scene"
          />
          <div className="canvas-badges">
            <span>{TILEFORGE_REFERENCE_FIXTURES[background].label}</span>
            <span>
              {SPRITE_FORGE_ACTORS[bindingActorId].label} · F
              {bindingPreview.actorFrame} · {bindingPreview.event}
            </span>
            <span>320×180 · 1× truth</span>
          </div>
        </div>

        <div className="lab-timeline">
          <button className="play-button" onClick={() => setPlaying((value) => !value)}>
            {playing ? "Pause" : "Play slice"}
          </button>
          <div className="timeline-copy">
            <strong>Actor → prefire → release</strong>
            <small>
              deterministic time {time.toFixed(2)} · F{bindingPreview.actorFrame}
            </small>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={time}
            aria-label="Combat slice time"
            onChange={(event) => {
              setPlaying(false);
              setTime(Number(event.target.value));
            }}
          />
          <button
            className="secondary-button"
            onClick={() => {
              if (canvasRef.current) {
                downloadCanvas(
                  canvasRef.current,
                  `effect-forge-${background}-${grayscale ? "grey" : "color"}.png`,
                );
              }
            }}
          >
            Export evidence PNG
          </button>
        </div>
      </div>

      <aside className="panel lab-controls">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Review controls</p>
            <h2>Fixture setup</h2>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="background">Stress background</label>
          <select
            id="background"
            value={background}
            onChange={(event) => setBackground(event.target.value as BackgroundId)}
          >
            {(Object.keys(TILEFORGE_REFERENCE_FIXTURES) as BackgroundId[]).map((id) => (
              <option value={id} key={id}>
                {TILEFORGE_REFERENCE_FIXTURES[id].label}
              </option>
            ))}
          </select>
          <small>
            Real TileForge RD7 reference crop · source tiles remain 32px.
          </small>
        </div>

        <div className="control-group">
          <label>Density preset</label>
          <div className="segmented">
            {(["focus", "slice", "stress"] as const).map((value) => (
              <button
                key={value}
                className={density === value ? "active" : ""}
                onClick={() => setDensity(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <div className="label-row">
            <label>Sprite Forge actor cast</label>
            <span>{spriteForgeSheets ? `${SPRITE_FORGE_CORPUS.actors} actors` : "loading"}</span>
          </div>
          <div className="segmented">
            {(["skirmish", "arcane"] as const).map((value) => (
              <button
                key={value}
                className={actorSet === value ? "active" : ""}
                onClick={() => setActorSet(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <small>
            Six manifest-backed representatives are live from the supplied pack.
          </small>
        </div>

        <div className="control-group binding-preview-editor">
          <div className="label-row">
            <label htmlFor="binding-actor">Candidate binding preview</label>
            <span>approval open</span>
          </div>
          <select
            id="binding-actor"
            value={bindingActorId}
            onChange={(event) => {
              const actorId = event.target.value as SpriteForgeActorId;
              const next = resolveBindingPreview(actorId, 0);
              setBindingActorId(actorId);
              setDensity("focus");
              setPlaying(false);
              setTime(timeForBindingFrame(actorId, next.prefireFrame));
            }}
          >
            {(Object.keys(SPRITE_FORGE_ACTORS) as SpriteForgeActorId[]).map(
              (actorId) => (
                <option value={actorId} key={actorId}>
                  {SPRITE_FORGE_ACTORS[actorId].label}
                </option>
              ),
            )}
          </select>
          <div
            className={`binding-event-strip ${bindingPreview.hasReleased ? "release" : ""}`}
          >
            <span>Live event</span>
            <strong>{bindingPreview.event}</strong>
            <code>
              {bindingPreview.mainSocket} [{bindingPreview.socket.join(", ")}]
            </code>
          </div>
          <p>Jump to actor frame</p>
          <div
            className="segmented binding-frame-buttons"
            style={{
              gridTemplateColumns: `repeat(${bindingPreview.candidate.frameCount}, 1fr)`,
            }}
          >
            {bindingPreview.candidate.frames.map((_, frame) => (
              <button
                className={bindingPreview.actorFrame === frame ? "active" : ""}
                key={frame}
                onClick={() => {
                  setPlaying(false);
                  setTime(timeForBindingFrame(bindingActorId, frame));
                }}
              >
                F{frame}
                {frame === bindingPreview.releaseFrame ? " · release" : ""}
              </button>
            ))}
          </div>
          <dl className="event-list">
            <div>
              <dt>sequence</dt>
              <dd>
                {bindingPreview.candidate.sequence}-down · row{" "}
                {bindingPreview.candidate.sourceRow}
              </dd>
            </div>
            <div><dt>prefire.begin</dt><dd>F{bindingPreview.prefireFrame}</dd></div>
            <div>
              <dt>{bindingPreview.candidate.releaseEvent}</dt>
              <dd>F{bindingPreview.releaseFrame}</dd>
            </div>
            <div><dt>release effect</dt><dd>{bindingPreview.effectId}</dd></div>
          </dl>
          <small>
            Read directly from the exported candidate companion binding. No
            approval is recorded here.
          </small>
        </div>

        <div className="truth-note">
          <strong>Truth source</strong>
          <p>
            Effects are composited over the supplied TileForge RD7 reference scenes.
            Telegraphs and cyan collision overlays still rasterize the same geometry
            object. The cyan or magenta cross is the selected candidate binding
            anchor for the live actor frame.
          </p>
          <small>
            {TILEFORGE_REFERENCE_CORPUS.scenes} scenes · {TILEFORGE_REFERENCE_CORPUS.flagships} flagships · {TILEFORGE_REFERENCE_CORPUS.themes} themes
          </small>
        </div>
      </aside>
    </section>
  );
}
