import { useEffect, useRef, useState } from "react";
import {
  loadActorSheets,
  type ActorSheetSet,
} from "../fixtures/actor-pack/assets";
import {
  loadSpriteForgeSheets,
  SPRITE_FORGE_CORPUS,
  type SpriteForgeActorSet,
  type SpriteForgeSheetSet,
} from "../fixtures/sprite-forge-full/assets";
import {
  loadTileForgeReferences,
  TILEFORGE_REFERENCE_CORPUS,
  TILEFORGE_REFERENCE_FIXTURES,
  type TileForgeReferenceImages,
} from "../fixtures/tileforge-reference/assets";
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
  const [socket, setSocket] = useState<[number, number]>([19, 14]);
  const [actorSet, setActorSet] = useState<SpriteForgeActorSet>("skirmish");
  const [playing, setPlaying] = useState(false);
  const [actorSheets, setActorSheets] = useState<ActorSheetSet | null>(null);
  const [spriteForgeSheets, setSpriteForgeSheets] =
    useState<SpriteForgeSheetSet | null>(null);
  const [tileForgeReferences, setTileForgeReferences] =
    useState<TileForgeReferenceImages | null>(null);

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
      socket,
      actorSet,
      actorSheets: actorSheets ?? undefined,
      spriteForgeSheets: spriteForgeSheets ?? undefined,
      tileForgeReferences: tileForgeReferences ?? undefined,
    });
  }, [
    actorSet,
    actorSheets,
    background,
    density,
    grayscale,
    hitboxTruth,
    layerOrderMode,
    socket,
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
            <span>320×180 · 1× truth</span>
          </div>
        </div>

        <div className="lab-timeline">
          <button className="play-button" onClick={() => setPlaying((value) => !value)}>
            {playing ? "Pause" : "Play slice"}
          </button>
          <div className="timeline-copy">
            <strong>Telegraph → active → contact</strong>
            <small>deterministic time {time.toFixed(2)}</small>
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

        <div className="control-group socket-editor">
          <div className="label-row">
            <label>Hostile cast · candidate socket</label>
            <span>{spriteForgeSheets ? "full pack" : actorSheets ? "v2.3 fallback" : "loading"}</span>
          </div>
          <p>Weapon-tip socket</p>
          <div className="coordinate-inputs">
            <label>
              X
              <input
                type="number"
                min={0}
                max={31}
                value={socket[0]}
                onChange={(event) => setSocket([Number(event.target.value), socket[1]])}
              />
            </label>
            <label>
              Y
              <input
                type="number"
                min={0}
                max={31}
                value={socket[1]}
                onChange={(event) => setSocket([socket[0], Number(event.target.value)])}
              />
            </label>
          </div>
          <dl className="event-list">
            <div><dt>prefire.begin</dt><dd>frame 1</dd></div>
            <div><dt>attack.release</dt><dd>frame 2</dd></div>
            <div><dt>foot pivot</dt><dd>16, 27</dd></div>
          </dl>
        </div>

        <div className="truth-note">
          <strong>Truth source</strong>
          <p>
            Effects are composited over the supplied TileForge RD7 reference scenes.
            Telegraphs and cyan collision overlays still rasterize the same geometry
            object.
          </p>
          <small>
            {TILEFORGE_REFERENCE_CORPUS.scenes} scenes · {TILEFORGE_REFERENCE_CORPUS.flagships} flagships · {TILEFORGE_REFERENCE_CORPUS.themes} themes
          </small>
        </div>
      </aside>
    </section>
  );
}
