export const hexToRgba = (hex: string): [number, number, number, number] => {
  const normalized = hex.replace("#", "");
  if (!/^[a-fA-F0-9]{6}$/.test(normalized)) {
    throw new Error(`Invalid six-digit color: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255,
  ];
};

export const rgbaToGrayscale = (
  rgba: Uint8ClampedArray,
): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(rgba);
  for (let i = 0; i < out.length; i += 4) {
    const luminance = Math.round(
      out[i]! * 0.2126 + out[i + 1]! * 0.7152 + out[i + 2]! * 0.0722,
    );
    out[i] = luminance;
    out[i + 1] = luminance;
    out[i + 2] = luminance;
  }
  return out;
};
