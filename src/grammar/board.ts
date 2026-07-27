import { RECIPE_BY_ID } from "../content/recipes";
import type { HostileRampId } from "../families/palettes";
import type { BackgroundId } from "../model/types";
import { drawPixelFrame } from "../renderer/canvas";
import { renderEffect } from "../renderer/renderEffect";
import { drawBackground } from "../lab/backgrounds";

export const GRAMMAR_PROJECTILES = [
  { id: "player.accurate-shot", short: "Dart", allegiance: "player" },
  { id: "player.spread-pellet", short: "Pellet", allegiance: "player" },
  { id: "player.pierce-return", short: "Return", allegiance: "player" },
  { id: "hostile.aimed-dart", short: "Needle", allegiance: "hostile" },
  { id: "hostile.predictive-orb", short: "Orb", allegiance: "hostile" },
  { id: "hostile.fan-crescent", short: "Crescent", allegiance: "hostile" },
  { id: "hostile.radial-shard", short: "Shard", allegiance: "hostile" },
] as const;

const projectileRecipe = (id: string) => {
  const recipe = RECIPE_BY_ID.get(id);
  if (!recipe) throw new Error(`Missing grammar-board recipe: ${id}`);
  return recipe;
};

const grayscaleCanvas = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const image = context.getImageData(0, 0, width, height);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.round(
      image.data[index]! * 0.2126 +
        image.data[index + 1]! * 0.7152 +
        image.data[index + 2]! * 0.0722,
    );
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
  }
  context.putImageData(image, 0, 0);
};

const signCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
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
  canvas.dataset.renderSignature = (signature >>> 0).toString(16).padStart(8, "0");
};

export const renderGrammarStrip = (
  canvas: HTMLCanvasElement,
  background: BackgroundId,
  paletteId: HostileRampId,
  grayscale: boolean,
): void => {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  context.imageSmoothingEnabled = false;
  drawBackground(context, background, canvas.width, canvas.height);

  context.fillStyle = "rgba(7, 10, 14, 0.52)";
  context.fillRect(0, 67, canvas.width, 29);
  context.fillStyle = grayscale ? "#d0d0d0" : "#7d9299";
  for (let index = 0; index < GRAMMAR_PROJECTILES.length; index += 1) {
    const item = GRAMMAR_PROJECTILES[index]!;
    const recipe = projectileRecipe(item.id);
    const frame = renderEffect(recipe, {
      frame: 1,
      paletteId: item.allegiance === "hostile" ? paletteId : undefined,
    });
    const x = 27 + index * 51;
    drawPixelFrame(context, frame, x, 37, 2, 0);
    context.fillStyle = item.allegiance === "hostile" ? "#f0a3a9" : "#8ee2dc";
    context.fillRect(x - 6, 73, 12, 1);
    context.fillStyle = "#c2ccd1";
    context.font = "6px Consolas, monospace";
    context.textAlign = "center";
    context.fillText(item.short.toUpperCase(), x, 85);
  }

  if (grayscale) grayscaleCanvas(context, canvas.width, canvas.height);
  signCanvas(canvas, context);
  canvas.dataset.palette = paletteId;
  canvas.dataset.background = background;
  canvas.dataset.mode = grayscale ? "grayscale" : "color";
};
