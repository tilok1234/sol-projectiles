import { ACTOR_COMBAT_BINDINGS } from "../content/bindings";
import { RECIPE_BY_ID } from "../content/recipes";
import type {
  ActorSheetSet,
  FixtureActorId,
} from "../fixtures/actor-pack/assets";
import { layerOrder } from "../model/layers";
import type {
  BackgroundId,
  PixelFrame,
  ThemeId,
  WorldLayer,
} from "../model/types";
import { renderEffect } from "../renderer/renderEffect";
import { drawPixelFrame } from "../renderer/canvas";
import { drawBackground } from "./backgrounds";

export interface LabOptions {
  background: BackgroundId;
  grayscale: boolean;
  hitboxTruth: boolean;
  layerOrderMode: boolean;
  density: "focus" | "slice" | "stress";
  time: number;
  socket: [number, number];
  actorSheets?: ActorSheetSet;
}

interface SceneEffect {
  id: string;
  x: number;
  y: number;
  angle?: number;
  scale?: number;
  progress?: number;
  reduced?: boolean;
}

const recipe = (id: string) => {
  const value = RECIPE_BY_ID.get(id);
  if (!value) throw new Error(`Missing scene recipe: ${id}`);
  return value;
};

const drawActorProxy = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: "player" | "hostile",
  grayscale: boolean,
): void => {
  const ink = grayscale ? "#191919" : "#1C1520";
  const body = grayscale ? (team === "player" ? "#A8A8A8" : "#6F6F6F") : team === "player" ? "#70A58D" : "#75506C";
  const accent = grayscale ? "#DADADA" : team === "player" ? "#D8C790" : "#C16B58";
  context.fillStyle = ink;
  context.fillRect(x - 5, y - 14, 10, 13);
  context.fillRect(x - 7, y - 9, 14, 7);
  context.fillStyle = body;
  context.fillRect(x - 4, y - 12, 8, 10);
  context.fillRect(x - 6, y - 8, 12, 5);
  context.fillStyle = accent;
  context.fillRect(x - 2, y - 11, 4, 3);
  context.fillStyle = ink;
  context.fillRect(x - 5, y - 2, 4, 3);
  context.fillRect(x + 1, y - 2, 4, 3);
};

const drawActorSheet = (
  context: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  x: number,
  y: number,
  frameColumn: number,
  grayscale: boolean,
): void => {
  context.save();
  context.imageSmoothingEnabled = false;
  if (grayscale) context.filter = "grayscale(1)";
  context.drawImage(
    sheet,
    frameColumn * 32,
    0,
    32,
    32,
    x - 16,
    y - 27,
    32,
    32,
  );
  context.restore();
};

const themeForBackground = (background: BackgroundId): ThemeId => {
  if (background === "snow") return "winter";
  if (background === "corruption") return "dusk";
  return "forest";
};

const geometryOutline = (
  context: CanvasRenderingContext2D,
  frame: PixelFrame,
  x: number,
  y: number,
): void => {
  if (!frame.geometryMask) return;
  context.save();
  context.fillStyle = "rgba(95, 240, 255, 0.8)";
  const originX = Math.round(x - frame.width / 2);
  const originY = Math.round(y - frame.height / 2);
  for (let py = 0; py < frame.height; py += 1) {
    for (let px = 0; px < frame.width; px += 1) {
      const index = py * frame.width + px;
      if (!frame.geometryMask[index]) continue;
      const left = px === 0 || !frame.geometryMask[index - 1];
      const right = px === frame.width - 1 || !frame.geometryMask[index + 1];
      const top = py === 0 || !frame.geometryMask[index - frame.width];
      const bottom =
        py === frame.height - 1 || !frame.geometryMask[index + frame.width];
      if (left || right || top || bottom) context.fillRect(originX + px, originY + py, 1, 1);
    }
  }
  context.restore();
};

const sceneEffects = (options: LabOptions): SceneEffect[] => {
  const t = options.time;
  const base: SceneEffect[] = [
    { id: "telegraph.delayed-ground", x: 214, y: 118, progress: t },
    { id: "zone.active-ground-hazard", x: 83, y: 126 },
    { id: "telegraph.prefire-glint", x: 245 + options.socket[0] - 16, y: 88 + options.socket[1] - 27 },
    { id: "player.accurate-shot", x: 95 + t * 62, y: 88, angle: -0.08 },
    { id: "hostile.aimed-dart", x: 228 - t * 72, y: 78, angle: Math.PI },
    { id: "hostile.predictive-orb", x: 176 - t * 24, y: 55 + t * 12 },
    { id: "feedback.hit-contact", x: 166, y: 86 },
    { id: "feedback.blocked-immune", x: 121, y: 115 },
    { id: "feedback.damage-number", x: 164, y: 64 },
    { id: "telegraph.chaser-lunge", x: 137, y: 136, progress: t },
    { id: "telegraph.elite-cast", x: 275, y: 136, progress: t },
    { id: "feedback.kill-pop", x: 116, y: 112 },
    { id: "feedback.player-hurt", x: 76, y: 84, angle: Math.PI },
  ];
  if (options.density === "focus") return base.slice(0, 5);
  if (options.density === "stress") {
    for (let index = 0; index < 5; index += 1) {
      base.push({
        id: "player.spread-pellet",
        x: 101 + t * 48,
        y: 91 + (index - 2) * 5,
        angle: (index - 2) * 0.12,
      });
    }
    base.push({
      id: "player.pierce-return",
      x: 132 + t * 38,
      y: 136 - t * 10,
      angle: -0.22,
    });
    for (let index = 0; index < 3; index += 1) {
      base.push({
        id: "hostile.fan-crescent",
        x: 232 - t * 48,
        y: 102 + (index - 1) * 14,
        angle: Math.PI + (index - 1) * 0.24,
      });
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      base.push({
        id: "hostile.radial-shard",
        x: 176 + Math.cos(angle) * 54,
        y: 86 + Math.sin(angle) * 42,
        angle,
      });
    }
  }
  return base;
};

export const renderLabScene = (
  canvas: HTMLCanvasElement,
  options: LabOptions,
): void => {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(context, options.background, canvas.width, canvas.height);

  const effects = sceneEffects(options)
    .map((entry) => ({ ...entry, recipe: recipe(entry.id) }))
    .sort((a, b) => layerOrder(a.recipe.worldLayer) - layerOrder(b.recipe.worldLayer));

  const actors = [
    {
      x: 76,
      y: 101,
      team: "player" as const,
      actor: "adventurer" as FixtureActorId,
      frameColumn: 10,
      layer: "ACTOR" as WorldLayer,
    },
    {
      x: 158,
      y: 101,
      team: "hostile" as const,
      actor: "bandit" as FixtureActorId,
      frameColumn: 13,
      layer: "ACTOR" as WorldLayer,
    },
    {
      x: 245,
      y: 101,
      team: "hostile" as const,
      actor: "bandit" as FixtureActorId,
      frameColumn: 9,
      layer: "ACTOR" as WorldLayer,
    },
    {
      x: 116,
      y: 137,
      team: "hostile" as const,
      actor: "bandit" as FixtureActorId,
      frameColumn: 2,
      layer: "ACTOR" as WorldLayer,
    },
  ];

  const drawable = [
    ...effects.map((entry) => ({ kind: "effect" as const, order: layerOrder(entry.recipe.worldLayer), entry })),
    ...actors.map((entry) => ({ kind: "actor" as const, order: layerOrder(entry.layer), entry })),
  ].sort((a, b) => a.order - b.order);

  for (const item of drawable) {
    if (item.kind === "actor") {
      const theme = themeForBackground(options.background);
      const sheet = options.actorSheets?.[item.entry.actor]?.[theme];
      if (sheet) {
        drawActorSheet(
          context,
          sheet,
          item.entry.x,
          item.entry.y,
          item.entry.frameColumn,
          options.grayscale,
        );
      } else {
        drawActorProxy(
          context,
          item.entry.x,
          item.entry.y,
          item.entry.team,
          options.grayscale,
        );
      }
      continue;
    }
    const effect = item.entry;
    const animationFrame = Math.floor(options.time * effect.recipe.animation.frames);
    const frame = renderEffect(effect.recipe, {
      frame: animationFrame,
      grayscale: options.grayscale,
      progress: effect.progress ?? options.time,
      reducedNumber: effect.reduced,
    });
    drawPixelFrame(
      context,
      frame,
      effect.x,
      effect.y,
      effect.scale ?? 1,
      effect.angle ?? 0,
    );
    if (options.hitboxTruth) geometryOutline(context, frame, effect.x, effect.y);
  }

  if (options.layerOrderMode) {
    context.fillStyle = "rgba(8, 9, 12, 0.82)";
    context.fillRect(7, 7, 124, 34);
    context.fillStyle = "#BCECF1";
    context.font = "6px monospace";
    context.fillText("180 TELEGRAPH → 200 HAZARD", 12, 18);
    context.fillText("400 ACTOR → 450 FEEDBACK", 12, 27);
    context.fillText("500 PLAYER → 600 HOSTILE", 12, 36);
  }

  if (options.hitboxTruth) {
    context.fillStyle = "#5FF0FF";
    context.font = "6px monospace";
    context.fillText("CYAN = COLLISION SOURCE", 198, 12);
  }

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let signature = 0x811c9dc5;
  let opaquePixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    signature ^= pixels[index]!;
    signature = Math.imul(signature, 0x01000193);
    signature ^= pixels[index + 1]!;
    signature = Math.imul(signature, 0x01000193);
    signature ^= pixels[index + 2]!;
    signature = Math.imul(signature, 0x01000193);
    if (pixels[index + 3]) opaquePixels += 1;
  }
  canvas.dataset.renderSignature = (signature >>> 0).toString(16).padStart(8, "0");
  canvas.dataset.opaquePixels = String(opaquePixels);
  canvas.dataset.effectIds = [...new Set(effects.map((entry) => entry.recipe.id))].join(",");
  canvas.dataset.effectCount = String(effects.length);
  canvas.dataset.uniqueEffectCount = String(
    new Set(effects.map((entry) => entry.recipe.id)).size,
  );

  void ACTOR_COMBAT_BINDINGS;
};
