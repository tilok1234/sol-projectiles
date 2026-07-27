import type { Bounds } from "../model/types";

export interface Mask {
  width: number;
  height: number;
  data: Uint8Array;
}

export const createMask = (width: number, height: number): Mask => ({
  width,
  height,
  data: new Uint8Array(width * height),
});

export const cloneMask = (mask: Mask): Mask => ({
  width: mask.width,
  height: mask.height,
  data: new Uint8Array(mask.data),
});

export const indexOf = (mask: Mask, x: number, y: number): number =>
  y * mask.width + x;

export const getPixel = (mask: Mask, x: number, y: number): number => {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return 0;
  return mask.data[indexOf(mask, x, y)] ?? 0;
};

export const setPixel = (mask: Mask, x: number, y: number, value = 1): void => {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return;
  mask.data[indexOf(mask, x, y)] = value ? 1 : 0;
};

export const forEachPixel = (
  mask: Mask,
  callback: (x: number, y: number, value: number) => void,
): void => {
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      callback(x, y, getPixel(mask, x, y));
    }
  }
};

export const union = (...masks: Mask[]): Mask => {
  const [first] = masks;
  if (!first) throw new Error("union requires at least one mask");
  const out = createMask(first.width, first.height);
  for (const mask of masks) {
    if (mask.width !== out.width || mask.height !== out.height) {
      throw new Error("union mask dimensions must match");
    }
    for (let i = 0; i < out.data.length; i += 1) {
      out.data[i] = out.data[i] || mask.data[i] ? 1 : 0;
    }
  }
  return out;
};

export const subtract = (base: Mask, cut: Mask): Mask => {
  if (base.width !== cut.width || base.height !== cut.height) {
    throw new Error("subtract mask dimensions must match");
  }
  const out = createMask(base.width, base.height);
  for (let i = 0; i < out.data.length; i += 1) {
    out.data[i] = base.data[i] && !cut.data[i] ? 1 : 0;
  }
  return out;
};

export const intersect = (a: Mask, b: Mask): Mask => {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error("intersect mask dimensions must match");
  }
  const out = createMask(a.width, a.height);
  for (let i = 0; i < out.data.length; i += 1) {
    out.data[i] = a.data[i] && b.data[i] ? 1 : 0;
  }
  return out;
};

export const translate = (mask: Mask, dx: number, dy: number): Mask => {
  const out = createMask(mask.width, mask.height);
  forEachPixel(mask, (x, y, value) => {
    if (value) setPixel(out, x + dx, y + dy);
  });
  return out;
};

export const mirrorHorizontal = (mask: Mask): Mask => {
  const out = createMask(mask.width, mask.height);
  forEachPixel(mask, (x, y, value) => {
    if (value) setPixel(out, mask.width - 1 - x, y);
  });
  return out;
};

export const dilate = (mask: Mask, radius = 1): Mask => {
  const out = cloneMask(mask);
  forEachPixel(mask, (x, y, value) => {
    if (!value) return;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) <= radius) setPixel(out, x + dx, y + dy);
      }
    }
  });
  return out;
};

export const erode = (mask: Mask, radius = 1): Mask => {
  const out = createMask(mask.width, mask.height);
  forEachPixel(mask, (x, y, value) => {
    if (!value) return;
    let survives = true;
    for (let dy = -radius; dy <= radius && survives; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (
          Math.abs(dx) + Math.abs(dy) <= radius &&
          !getPixel(mask, x + dx, y + dy)
        ) {
          survives = false;
          break;
        }
      }
    }
    if (survives) setPixel(out, x, y);
  });
  return out;
};

export const outline = (mask: Mask): Mask => subtract(dilate(mask, 1), mask);

export const hatch = (mask: Mask, density: 1 | 2 | 3 | 4, phase = 0): Mask => {
  const out = createMask(mask.width, mask.height);
  const thresholds = [1, 2, 3, 4];
  forEachPixel(mask, (x, y, value) => {
    if (!value) return;
    const sample = (x * 3 + y * 5 + phase) % 4;
    if (sample < thresholds[density - 1]!) setPixel(out, x, y);
  });
  return out;
};

export const occupiedBounds = (mask: Mask): Bounds | null => {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;
  forEachPixel(mask, (x, y, value) => {
    if (!value) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  if (maxX < 0 || maxY < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
};

export const masksEqual = (a: Mask, b: Mask): boolean => {
  if (a.width !== b.width || a.height !== b.height) return false;
  return a.data.every((value, index) => value === b.data[index]);
};

export const maskSignature = (mask: Mask): string =>
  `${mask.width}x${mask.height}:${Array.from(mask.data).join("")}`;
