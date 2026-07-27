import { useEffect, useMemo, useRef, useState } from "react";
import {
  SOCKET_REVIEW_CANDIDATES,
  SOCKET_REVIEW_STATUS,
  buildCandidateBindings,
  type ReviewSocketKind,
  type SocketReviewCandidate,
} from "../content/socket-review";
import { downloadText } from "../exporter/pack";
import {
  SPRITE_FORGE_ACTORS,
  loadSpriteForgeSheets,
  type SpriteForgeActorId,
  type SpriteForgeSheetSet,
} from "../fixtures/sprite-forge-full/assets";

const cloneCandidates = (): SocketReviewCandidate[] =>
  SOCKET_REVIEW_CANDIDATES.map((candidate) => ({
    ...candidate,
    frames: candidate.frames.map((frame) => ({ ...frame })),
  }));

const markerColor = (kind: ReviewSocketKind) =>
  kind === "weaponTip" ? "#5ff0ff" : "#e98cff";

const drawCross = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius = 6,
) => {
  context.strokeStyle = "#0b0e13";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x - radius, y);
  context.lineTo(x + radius, y);
  context.moveTo(x, y - radius);
  context.lineTo(x, y + radius);
  context.stroke();
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
};

interface SequenceCanvasProps {
  candidate: SocketReviewCandidate;
  selectedFrame: number;
  sheet?: HTMLImageElement;
  onSelectFrame: (frame: number) => void;
}

function SequenceCanvas({
  candidate,
  selectedFrame,
  sheet,
  onSelectFrame,
}: SequenceCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameStride = 140;
  const drawSize = 128;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#090c11";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 16) {
      for (let x = 0; x < canvas.width; x += 16) {
        context.fillStyle = (x / 16 + y / 16) % 2 ? "#10161e" : "#0d1219";
        context.fillRect(x, y, 16, 16);
      }
    }

    const sequenceWidth = candidate.frameCount * frameStride;
    const startX = Math.floor((canvas.width - sequenceWidth) / 2) + 6;
    for (let frameIndex = 0; frameIndex < candidate.frameCount; frameIndex += 1) {
      const x = startX + frameIndex * frameStride;
      const y = 25;
      if (sheet) {
        context.drawImage(
          sheet,
          frameIndex * 64,
          candidate.sourceRow * 64,
          64,
          64,
          x,
          y,
          drawSize,
          drawSize,
        );
      }

      const frame = candidate.frames[frameIndex]!;
      const ground = frame.groundOrigin;
      const hurt = frame.hurtCenter;
      const main = frame[candidate.mainSocket];
      if (ground) {
        context.strokeStyle = "rgba(113, 225, 219, 0.7)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x + ground[0] * 4 - 15, y + ground[1] * 4);
        context.lineTo(x + ground[0] * 4 + 15, y + ground[1] * 4);
        context.stroke();
      }
      if (hurt) {
        const hx = x + hurt[0] * 4;
        const hy = y + hurt[1] * 4;
        context.strokeStyle = "#f7c86a";
        context.lineWidth = 2;
        context.strokeRect(hx - 4, hy - 4, 8, 8);
      }
      if (main) {
        const mx = x + main[0] * 4;
        const my = y + main[1] * 4;
        context.fillStyle = markerColor(candidate.mainSocket);
        context.beginPath();
        context.arc(mx, my, 5, 0, Math.PI * 2);
        context.fill();
        drawCross(context, mx, my, markerColor(candidate.mainSocket), 9);
      }

      context.strokeStyle =
        frameIndex === candidate.releaseFrame
          ? "#f7c86a"
          : frameIndex === selectedFrame
            ? "#71e1db"
            : "#2a3541";
      context.lineWidth =
        frameIndex === candidate.releaseFrame || frameIndex === selectedFrame ? 2 : 1;
      context.strokeRect(x - 2, y - 2, drawSize + 4, drawSize + 4);
      context.fillStyle =
        frameIndex === candidate.releaseFrame ? "#f7c86a" : "#82909d";
      context.font = "700 10px Consolas, monospace";
      context.fillText(
        `F${frameIndex}${frameIndex === candidate.releaseFrame ? "  RELEASE" : ""}`,
        x,
        15,
      );
    }

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let signature = 0x811c9dc5;
    for (let index = 0; index < pixels.length; index += 4) {
      signature ^= pixels[index]!;
      signature = Math.imul(signature, 0x01000193);
      signature ^= pixels[index + 1]!;
      signature = Math.imul(signature, 0x01000193);
      signature ^= pixels[index + 2]!;
      signature = Math.imul(signature, 0x01000193);
    }
    canvas.dataset.renderSignature = (signature >>> 0)
      .toString(16)
      .padStart(8, "0");
  }, [candidate, selectedFrame, sheet]);

  return (
    <canvas
      aria-label={`${candidate.label} frame and socket review`}
      className="socket-sequence-canvas"
      data-actor-id={candidate.actorId}
      data-release-frame={candidate.releaseFrame}
      data-source-row={candidate.sourceRow}
      data-socket-kind={candidate.mainSocket}
      height={172}
      onClick={(event) => {
        const canvas = event.currentTarget;
        const bounds = canvas.getBoundingClientRect();
        const logicalX = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
        const sequenceWidth = candidate.frameCount * frameStride;
        const startX = Math.floor((canvas.width - sequenceWidth) / 2) + 6;
        const frame = Math.floor((logicalX - startX) / frameStride);
        if (frame >= 0 && frame < candidate.frameCount) onSelectFrame(frame);
      }}
      ref={ref}
      width={450}
    />
  );
}

export function SocketReview() {
  const [candidates, setCandidates] = useState(cloneCandidates);
  const [selectedId, setSelectedId] =
    useState<SpriteForgeActorId>("ranger");
  const [selectedFrame, setSelectedFrame] = useState(2);
  const [sheets, setSheets] = useState<SpriteForgeSheetSet | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadSpriteForgeSheets()
      .then(setSheets)
      .catch((error: unknown) => {
        setLoadError(
          error instanceof Error ? error.message : "Could not load actor sheets.",
        );
      });
  }, []);

  const candidate = useMemo(
    () => candidates.find((entry) => entry.actorId === selectedId)!,
    [candidates, selectedId],
  );
  const frame = candidate.frames[selectedFrame] ?? candidate.frames[0]!;
  const point = frame[candidate.mainSocket]!;

  const selectActor = (actorId: SpriteForgeActorId) => {
    const next = candidates.find((entry) => entry.actorId === actorId)!;
    setSelectedId(actorId);
    setSelectedFrame(next.releaseFrame);
  };

  const updatePoint = (axis: 0 | 1, value: number) => {
    const clamped = Math.max(0, Math.min(31, Math.round(value)));
    setCandidates((current) =>
      current.map((entry) => {
        if (entry.actorId !== selectedId) return entry;
        return {
          ...entry,
          frames: entry.frames.map((entryFrame, index) => {
            if (index !== selectedFrame) return entryFrame;
            const currentPoint = entryFrame[entry.mainSocket]!;
            const nextPoint: [number, number] = [...currentPoint];
            nextPoint[axis] = clamped;
            return { ...entryFrame, [entry.mainSocket]: nextPoint };
          }),
        };
      }),
    );
  };

  const updateReleaseFrame = (releaseFrame: number) => {
    setCandidates((current) =>
      current.map((entry) =>
        entry.actorId === selectedId ? { ...entry, releaseFrame } : entry,
      ),
    );
    setSelectedFrame(releaseFrame);
  };

  return (
    <section className="socket-review-layout" aria-label="Socket and release review">
      <aside className="panel socket-actor-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Companion bindings</p>
            <h2>Six live actors</h2>
          </div>
          <span className="count-badge">0/6 approved</span>
        </div>
        <div className="socket-actor-list">
          {candidates.map((entry, index) => (
            <button
              className={entry.actorId === selectedId ? "active" : ""}
              key={entry.actorId}
              onClick={() => selectActor(entry.actorId)}
            >
              <span className="socket-list-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{SPRITE_FORGE_ACTORS[entry.actorId].label}</strong>
                <small>
                  {entry.sequence}-down · row {entry.sourceRow} ·{" "}
                  {entry.frameCount}f
                </small>
              </span>
              <i>Candidate</i>
            </button>
          ))}
        </div>
        <div className="socket-scope-note">
          <strong>Approval scope</strong>
          <p>
            Release timing and primary attachment point only. Hurt center and
            ground origin are visible supporting anchors.
          </p>
        </div>
      </aside>

      <main className="panel socket-stage">
        <div className="socket-stage-heading">
          <div>
            <p className="eyebrow">Exact frame review · logical 32 px grid</p>
            <h1>{candidate.label}</h1>
            <p>
              Source row {candidate.sourceRow} · {candidate.sequence}-down ·
              zero-based frame contract
            </p>
          </div>
          <span className="candidate-pill">Candidate · approval open</span>
        </div>

        <div className="socket-canvas-wrap">
          <SequenceCanvas
            candidate={candidate}
            onSelectFrame={setSelectedFrame}
            selectedFrame={selectedFrame}
            sheet={sheets?.[candidate.actorId]}
          />
          {loadError && <p className="socket-load-error">{loadError}</p>}
        </div>

        <div className="socket-legend" aria-label="Marker legend">
          <span><i className="legend-primary" />{candidate.mainSocket}</span>
          <span><i className="legend-hurt" />hurt center</span>
          <span><i className="legend-ground" />ground origin</span>
          <span><i className="legend-release" />release frame</span>
        </div>

        <div className="socket-controls">
          <div className="frame-control">
            <span>Inspect frame</span>
            <div>
              {candidate.frames.map((_, index) => (
                <button
                  className={selectedFrame === index ? "active" : ""}
                  key={index}
                  onClick={() => setSelectedFrame(index)}
                >
                  F{index}
                </button>
              ))}
            </div>
          </div>
          <div className="frame-control">
            <span>Release event</span>
            <div>
              {candidate.frames.map((_, index) => (
                <button
                  className={candidate.releaseFrame === index ? "release active" : ""}
                  key={index}
                  onClick={() => updateReleaseFrame(index)}
                >
                  F{index}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span>{candidate.mainSocket} X</span>
            <input
              aria-label={`${candidate.mainSocket} X`}
              max={31}
              min={0}
              onChange={(event) => updatePoint(0, Number(event.target.value))}
              type="number"
              value={point[0]}
            />
          </label>
          <label>
            <span>{candidate.mainSocket} Y</span>
            <input
              aria-label={`${candidate.mainSocket} Y`}
              max={31}
              min={0}
              onChange={(event) => updatePoint(1, Number(event.target.value))}
              type="number"
              value={point[1]}
            />
          </label>
        </div>

        <div className="socket-readout">
          <div>
            <span>Selected</span>
            <strong>F{selectedFrame}</strong>
          </div>
          <div>
            <span>Primary socket</span>
            <code>[{point[0]}, {point[1]}]</code>
          </div>
          <div>
            <span>Event</span>
            <code>{candidate.releaseEvent}@F{candidate.releaseFrame}</code>
          </div>
          <div>
            <span>Source</span>
            <code>{candidate.actorId}.png · row {candidate.sourceRow}</code>
          </div>
        </div>
      </main>

      <aside className="panel socket-decision-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Visual gate</p>
            <h2>Review decision</h2>
          </div>
          <span className="status-dot">open</span>
        </div>
        <div className="decision-state">
          <span>{SOCKET_REVIEW_STATUS.approved}/{SOCKET_REVIEW_STATUS.total}</span>
          <strong>No socket approvals recorded</strong>
          <p>
            Each marker is an editable proposal over the exact supplied animation
            frame. Changes remain local until exported.
          </p>
        </div>
        <ol className="socket-checklist">
          <li><span>1</span>Check the gold release frame.</li>
          <li><span>2</span>Check the primary marker touches the emission point.</li>
          <li><span>3</span>Reply with approval or actor-specific changes.</li>
        </ol>
        <div className="coordinate-contract">
          <strong>Coordinate contract</strong>
          <code>origin = cell top-left</code>
          <code>range = 0..31</code>
          <code>frame = zero-based</code>
          <code>source export = ×2</code>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            downloadText(
              "sprite-forge-socket-candidates.json",
              `${JSON.stringify(buildCandidateBindings(candidates), null, 2)}\n`,
            )
          }
        >
          Export edited candidate
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            const restored = cloneCandidates();
            setCandidates(restored);
            const selected = restored.find((entry) => entry.actorId === selectedId)!;
            setSelectedFrame(selected.releaseFrame);
          }}
        >
          Reset local edits
        </button>
      </aside>
    </section>
  );
}
