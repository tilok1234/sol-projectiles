import { PALETTES } from "../families/palettes";
import type { EffectRecipe, PixelFrame } from "../model/types";
import {
  burstMask,
  chevronMask,
  geometryMaskFromRecipe,
  glintMask,
  needleMask,
  numberMask,
  orbMask,
  pelletMask,
  playerDartMask,
  crescentMask,
  returnBladeMask,
  starShardMask,
} from "../masks/primitives";
import {
  createMask,
  dilate,
  erode,
  getPixel,
  hatch,
  occupiedBounds,
  outline,
  setPixel,
  subtract,
  type Mask,
  union,
} from "../masks/mask";
import { hexToRgba, rgbaToGrayscale } from "./color";

export interface RenderOptions {
  frame?: number;
  grayscale?: boolean;
  progress?: number;
  reducedNumber?: boolean;
  paletteId?: string;
}

interface Channels {
  silhouette: Mask;
  ink: Mask;
  body: Mask;
  core: Mask;
  echo: Mask;
  geometry?: Mask;
}

const emptyChannels = (recipe: EffectRecipe): Channels => {
  const create = () => createMask(recipe.frame.w, recipe.frame.h);
  return {
    silhouette: create(),
    ink: create(),
    body: create(),
    core: create(),
    echo: create(),
  };
};

const insetCore = (mask: Mask): Mask => {
  const first = erode(mask, 1);
  return first.data.some(Boolean) ? first : mask;
};

const makeTelegraph = (
  recipe: EffectRecipe,
  frame: number,
  progress: number,
): Channels => {
  const channels = emptyChannels(recipe);
  const geometry = geometryMaskFromRecipe(recipe);
  const inner = erode(geometry, 1);
  const boundary = subtract(geometry, inner);
  const step = Math.max(1, Math.min(4, Math.ceil(progress * 4)));
  channels.silhouette = geometry;
  channels.ink = boundary;
  channels.body = hatch(inner, step as 1 | 2 | 3 | 4, frame);
  channels.core = step === 4 ? erode(inner, 2) : createMask(recipe.frame.w, recipe.frame.h);
  channels.geometry = geometry;
  return channels;
};

const makeHazard = (recipe: EffectRecipe, frame: number): Channels => {
  const channels = emptyChannels(recipe);
  const geometry = geometryMaskFromRecipe(recipe);
  const boundary = subtract(geometry, erode(geometry, 1));
  const body = erode(geometry, 1);
  const teeth = createMask(recipe.frame.w, recipe.frame.h);
  for (let y = 0; y < teeth.height; y += 1) {
    for (let x = 0; x < teeth.width; x += 1) {
      if (getPixel(body, x, y) && (x + y + frame) % 3 !== 0) setPixel(teeth, x, y);
    }
  }
  channels.silhouette = geometry;
  channels.ink = boundary;
  channels.body = teeth;
  channels.core = hatch(erode(body, 2), 2, frame + 1);
  channels.geometry = geometry;
  return channels;
};

const buildChannels = (
  recipe: EffectRecipe,
  frame: number,
  progress: number,
  reducedNumber: boolean,
): Channels => {
  if (recipe.class === "telegraph" && recipe.render.silhouette === "ground.circle") {
    return makeTelegraph(recipe, frame, progress);
  }
  if (recipe.class === "zone") return makeHazard(recipe, frame);

  const channels = emptyChannels(recipe);
  let base: Mask;
  switch (recipe.render.silhouette) {
    case "projectile.player-dart":
      base = playerDartMask(recipe.frame.w, recipe.frame.h);
      break;
    case "projectile.hostile-needle":
      base = needleMask(recipe.frame.w, recipe.frame.h);
      break;
    case "projectile.pellet":
      base = pelletMask(recipe.frame.w, recipe.frame.h);
      break;
    case "projectile.return-blade":
      base = returnBladeMask(recipe.frame.w, recipe.frame.h);
      break;
    case "projectile.orb":
      base = orbMask(recipe.frame.w, recipe.frame.h);
      break;
    case "projectile.crescent":
      base = crescentMask(recipe.frame.w, recipe.frame.h);
      break;
    case "projectile.star-shard":
      base = starShardMask(recipe.frame.w, recipe.frame.h);
      break;
    case "socket.glint":
      base = glintMask(recipe.frame.w, recipe.frame.h, frame);
      break;
    case "impact.burst":
      base = burstMask(recipe.frame.w, recipe.frame.h, frame);
      break;
    case "impact.chevron":
      base = chevronMask(recipe.frame.w, recipe.frame.h, frame);
      break;
    case "glyph.damage":
      base = numberMask(recipe.frame.w, recipe.frame.h, "12", reducedNumber);
      break;
    default:
      base = geometryMaskFromRecipe(recipe);
      break;
  }

  channels.silhouette = union(base, dilate(base, 1));
  channels.ink = outline(base);
  channels.body = base;
  channels.core = insetCore(base);

  if (
    recipe.render.silhouette === "projectile.player-dart" ||
    recipe.render.silhouette === "projectile.hostile-needle"
  ) {
    channels.core = createMask(recipe.frame.w, recipe.frame.h);
    setPixel(
      channels.core,
      recipe.frame.w - 3,
      Math.floor(recipe.frame.h / 2),
    );
  }
  if (recipe.render.silhouette === "socket.glint") {
    channels.ink = createMask(recipe.frame.w, recipe.frame.h);
    channels.body = base;
    channels.core = insetCore(base);
  }
  if (recipe.render.silhouette === "impact.chevron") {
    channels.core = createMask(recipe.frame.w, recipe.frame.h);
  }
  if (recipe.render.silhouette === "glyph.damage") {
    channels.ink = outline(base);
    channels.core = createMask(recipe.frame.w, recipe.frame.h);
  }
  return channels;
};

const paintMask = (
  rgba: Uint8ClampedArray,
  width: number,
  mask: Mask,
  color: [number, number, number, number],
): void => {
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (!getPixel(mask, x, y)) continue;
      const index = (y * width + x) * 4;
      rgba[index] = color[0];
      rgba[index + 1] = color[1];
      rgba[index + 2] = color[2];
      rgba[index + 3] = color[3];
    }
  }
};

export const renderEffect = (
  recipe: EffectRecipe,
  options: RenderOptions = {},
): PixelFrame => {
  const frame = Math.abs(options.frame ?? 0) % recipe.animation.frames;
  const progress = Math.max(0, Math.min(1, options.progress ?? 0.5));
  const paletteId = options.paletteId ?? recipe.render.treatment;
  const palette = PALETTES[paletteId];
  if (!palette) throw new Error(`Unknown treatment: ${paletteId}`);

  const channels = buildChannels(
    recipe,
    frame,
    progress,
    options.reducedNumber ?? false,
  );
  const rgba = new Uint8ClampedArray(recipe.frame.w * recipe.frame.h * 4);
  paintMask(rgba, recipe.frame.w, channels.echo, hexToRgba(palette.echo));
  paintMask(rgba, recipe.frame.w, channels.ink, hexToRgba(palette.ink));
  paintMask(rgba, recipe.frame.w, channels.body, hexToRgba(palette.body));
  paintMask(rgba, recipe.frame.w, channels.core, hexToRgba(palette.core));

  return {
    width: recipe.frame.w,
    height: recipe.frame.h,
    rgba: options.grayscale ? rgbaToGrayscale(rgba) : rgba,
    occupiedBounds: occupiedBounds(channels.silhouette),
    geometryMask: channels.geometry?.data,
  };
};

export const hasBinaryAlpha = (frame: PixelFrame): boolean => {
  for (let index = 3; index < frame.rgba.length; index += 4) {
    const alpha = frame.rgba[index];
    if (alpha !== 0 && alpha !== 255) return false;
  }
  return true;
};
