import type { EffectRecipe } from "../model/types";
import {
  createMask,
  erode,
  setPixel,
  subtract,
  type Mask,
  union,
} from "./mask";

export const circleMask = (
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
): Mask => {
  const mask = createMask(width, height);
  const limit = radius * radius + radius;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= limit) setPixel(mask, x, y);
    }
  }
  return mask;
};

export const rectangleMask = (
  width: number,
  height: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
): Mask => {
  const mask = createMask(width, height);
  for (let py = y; py < y + rectHeight; py += 1) {
    for (let px = x; px < x + rectWidth; px += 1) setPixel(mask, px, py);
  }
  return mask;
};

export const capsuleMask = (
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  length: number,
  radius: number,
): Mask => {
  const body = rectangleMask(
    width,
    height,
    centerX - Math.floor(length / 2),
    centerY - radius,
    length,
    radius * 2 + 1,
  );
  const left = circleMask(
    width,
    height,
    centerX - Math.floor(length / 2),
    centerY,
    radius,
  );
  const right = circleMask(
    width,
    height,
    centerX + Math.floor(length / 2),
    centerY,
    radius,
  );
  return union(body, left, right);
};

export const needleMask = (width: number, height: number): Mask => {
  const mask = createMask(width, height);
  const cy = Math.floor(height / 2);
  for (let x = 2; x < width - 2; x += 1) setPixel(mask, x, cy);
  for (let x = Math.max(2, width - 5); x < width - 1; x += 1) {
    setPixel(mask, x, cy - 1);
    setPixel(mask, x, cy + 1);
  }
  setPixel(mask, 1, cy);
  return mask;
};

export const playerDartMask = (width: number, height: number): Mask => {
  const mask = createMask(width, height);
  const cy = Math.floor(height / 2);
  for (let x = 2; x < width - 3; x += 1) setPixel(mask, x, cy);
  setPixel(mask, width - 3, cy);
  setPixel(mask, width - 4, cy - 1);
  return mask;
};

export const pelletMask = (width: number, height: number): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  setPixel(mask, cx, cy - 1);
  setPixel(mask, cx - 1, cy);
  setPixel(mask, cx, cy);
  setPixel(mask, cx + 1, cy);
  setPixel(mask, cx, cy + 1);
  return mask;
};

export const returnBladeMask = (width: number, height: number): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  for (let x = cx - 5; x <= cx + 4; x += 1) {
    setPixel(mask, x, cy);
    if (x > cx - 4 && x < cx + 3) setPixel(mask, x, cy - 1);
  }
  setPixel(mask, cx - 4, cy + 1);
  setPixel(mask, cx - 3, cy + 2);
  setPixel(mask, cx - 2, cy + 2);
  setPixel(mask, cx + 3, cy + 1);
  setPixel(mask, cx + 4, cy - 1);
  setPixel(mask, cx + 5, cy - 2);
  return mask;
};

export const crescentMask = (width: number, height: number): Mask => {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const outer = circleMask(width, height, cx - 1, cy, 4);
  const cut = circleMask(width, height, cx + 1, cy, 3);
  const mask = subtract(outer, cut);
  setPixel(mask, cx + 2, cy - 4);
  setPixel(mask, cx + 2, cy + 4);
  return mask;
};

export const starShardMask = (width: number, height: number): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const points: Array<[number, number]> = [
    [0, -3],
    [0, -2],
    [-1, -1],
    [0, -1],
    [1, -1],
    [-3, 0],
    [-2, 0],
    [-1, 0],
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [0, 2],
    [0, 3],
  ];
  for (const [dx, dy] of points) setPixel(mask, cx + dx, cy + dy);
  return mask;
};

export const orbMask = (width: number, height: number): Mask =>
  circleMask(
    width,
    height,
    Math.floor(width / 2),
    Math.floor(height / 2),
    Math.max(2, Math.floor(Math.min(width, height) / 3)),
  );

export const glintMask = (width: number, height: number, frame: number): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const arm = frame % 3 === 1 ? 3 : 2;
  for (let offset = -arm; offset <= arm; offset += 1) {
    setPixel(mask, cx + offset, cy);
    setPixel(mask, cx, cy + offset);
  }
  if (frame % 3 === 2) {
    setPixel(mask, cx - 1, cy - 1);
    setPixel(mask, cx + 1, cy + 1);
  }
  return mask;
};

export const burstMask = (width: number, height: number, frame: number): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const reach = Math.min(2 + frame, Math.floor(width / 2) - 1);
  const points: Array<[number, number]> = [
    [0, 0],
    [reach, 0],
    [-reach + 1, 0],
    [0, reach],
    [0, -reach],
    [reach - 1, -reach + 1],
    [-reach + 1, reach],
  ];
  for (const [dx, dy] of points) {
    setPixel(mask, cx + dx, cy + dy);
    if (frame < 2) setPixel(mask, cx + dx - Math.sign(dx), cy + dy - Math.sign(dy));
  }
  return mask;
};

export const chevronMask = (
  width: number,
  height: number,
  frame: number,
): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2) - Math.min(frame, 2);
  const cy = Math.floor(height / 2);
  for (let offset = -3; offset <= 3; offset += 1) {
    setPixel(mask, cx + Math.abs(offset), cy + offset);
    if (frame < 2) setPixel(mask, cx + Math.abs(offset) + 1, cy + offset);
  }
  return mask;
};

export const crownPopMask = (
  width: number,
  height: number,
  frame: number,
): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2);
  const lift = Math.min(frame, 3);
  const baseY = Math.floor(height / 2) + 3 - lift;

  for (let x = cx - 4; x <= cx + 4; x += 1) {
    if (frame < 4 || Math.abs(x - cx) <= 2) setPixel(mask, x, baseY);
  }
  const peaks: Array<[number, number]> = [
    [-4, -3],
    [-2, -1],
    [0, -4],
    [2, -1],
    [4, -3],
  ];
  for (const [dx, dy] of peaks) {
    setPixel(mask, cx + dx, baseY + dy);
    if (frame < 3) setPixel(mask, cx + dx, baseY + dy + 1);
  }
  if (frame < 2) {
    setPixel(mask, cx - 3, baseY - 1);
    setPixel(mask, cx - 1, baseY - 1);
    setPixel(mask, cx + 1, baseY - 1);
    setPixel(mask, cx + 3, baseY - 1);
  }
  return mask;
};

export const hurtWedgeMask = (
  width: number,
  height: number,
  frame: number,
): Mask => {
  const mask = createMask(width, height);
  const cx = Math.floor(width / 2) - 2;
  const cy = Math.floor(height / 2);
  const reach = frame === 1 ? 6 : frame === 2 ? 4 : 5;

  setPixel(mask, cx, cy);
  setPixel(mask, cx + 1, cy);
  for (let step = 1; step <= reach; step += 1) {
    const spread = Math.max(1, Math.floor((step + 1) / 2));
    setPixel(mask, cx + step, cy - spread);
    setPixel(mask, cx + step, cy + spread);
    if (step < 3) setPixel(mask, cx + step, cy);
  }
  return mask;
};

const DIGITS: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

export const numberMask = (
  width: number,
  height: number,
  text: string,
  reduced = false,
): Mask => {
  const mask = createMask(width, height);
  const glyphWidth = 3;
  const startX = Math.floor((width - (text.length * 4 - 1)) / 2);
  const startY = Math.floor((height - 5) / 2);
  for (let charIndex = 0; charIndex < text.length; charIndex += 1) {
    const glyph = DIGITS[text[charIndex] ?? "0"] ?? DIGITS["0"]!;
    for (let y = 0; y < glyph.length; y += 1) {
      for (let x = 0; x < glyphWidth; x += 1) {
        if (glyph[y]?.[x] === "1") {
          setPixel(mask, startX + charIndex * 4 + x, startY + y);
        }
      }
    }
  }
  if (reduced) {
    setPixel(mask, startX - 2, startY);
    setPixel(mask, startX - 2, startY + 1);
    setPixel(mask, startX - 1, startY + 2);
    setPixel(mask, startX + text.length * 4, startY);
    setPixel(mask, startX + text.length * 4, startY + 1);
    setPixel(mask, startX + text.length * 4 - 1, startY + 2);
  }
  return mask;
};

export const geometryMaskFromRecipe = (recipe: EffectRecipe): Mask => {
  const { w, h, pivot } = recipe.frame;
  const geometry = recipe.geometry;
  if (geometry.shape === "circle") {
    return circleMask(w, h, pivot[0], pivot[1], geometry.radiusPx ?? 1);
  }
  if (geometry.shape === "rectangle") {
    const rw = geometry.widthPx ?? w;
    const rh = geometry.heightPx ?? h;
    return rectangleMask(
      w,
      h,
      pivot[0] - Math.floor(rw / 2),
      pivot[1] - Math.floor(rh / 2),
      rw,
      rh,
    );
  }
  if (geometry.shape === "capsule") {
    return capsuleMask(
      w,
      h,
      pivot[0],
      pivot[1],
      geometry.lengthPx ?? Math.floor(w / 2),
      geometry.radiusPx ?? 2,
    );
  }
  const mask = createMask(w, h);
  setPixel(mask, pivot[0], pivot[1]);
  return mask;
};

export const boundaryFromGeometry = (recipe: EffectRecipe): Mask => {
  const geometry = geometryMaskFromRecipe(recipe);
  return subtract(geometry, erode(geometry, 1));
};
