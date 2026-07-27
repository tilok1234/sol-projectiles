import type { PixelFrame } from "../model/types";

export const frameToCanvas = (frame: PixelFrame): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  context.imageSmoothingEnabled = false;
  context.putImageData(
    new ImageData(new Uint8ClampedArray(frame.rgba), frame.width, frame.height),
    0,
    0,
  );
  return canvas;
};

export const drawPixelFrame = (
  context: CanvasRenderingContext2D,
  frame: PixelFrame,
  x: number,
  y: number,
  scale = 1,
  angle = 0,
): void => {
  const source = frameToCanvas(frame);
  context.save();
  context.imageSmoothingEnabled = false;
  context.translate(Math.round(x), Math.round(y));
  context.rotate(angle);
  context.drawImage(
    source,
    -Math.floor((frame.width * scale) / 2),
    -Math.floor((frame.height * scale) / 2),
    frame.width * scale,
    frame.height * scale,
  );
  context.restore();
};

export const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, "image/png");
};
