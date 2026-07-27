import { useEffect, useRef } from "react";
import type { EffectRecipe } from "../model/types";
import { renderEffect } from "../renderer/renderEffect";
import { frameToCanvas } from "../renderer/canvas";

interface EffectPreviewProps {
  recipe: EffectRecipe;
  frame: number;
  grayscale: boolean;
  grid: boolean;
  showBounds: boolean;
  progress: number;
}

export function EffectPreview({
  recipe,
  frame,
  grayscale,
  grid,
  showBounds,
  progress,
}: EffectPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#141922";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const pixelFrame = renderEffect(recipe, { frame, grayscale, progress });
    const source = frameToCanvas(pixelFrame);
    const scale = Math.max(
      4,
      Math.floor(
        Math.min(
          (canvas.width - 36) / pixelFrame.width,
          (canvas.height - 36) / pixelFrame.height,
        ),
      ),
    );
    const drawWidth = pixelFrame.width * scale;
    const drawHeight = pixelFrame.height * scale;
    const originX = Math.floor((canvas.width - drawWidth) / 2);
    const originY = Math.floor((canvas.height - drawHeight) / 2);
    context.drawImage(source, originX, originY, drawWidth, drawHeight);

    if (grid && scale >= 6) {
      context.strokeStyle = "rgba(120, 161, 169, 0.16)";
      context.lineWidth = 1;
      context.beginPath();
      for (let x = 0; x <= pixelFrame.width; x += 1) {
        context.moveTo(originX + x * scale + 0.5, originY);
        context.lineTo(originX + x * scale + 0.5, originY + drawHeight);
      }
      for (let y = 0; y <= pixelFrame.height; y += 1) {
        context.moveTo(originX, originY + y * scale + 0.5);
        context.lineTo(originX + drawWidth, originY + y * scale + 0.5);
      }
      context.stroke();
    }

    if (showBounds && pixelFrame.occupiedBounds) {
      const bounds = pixelFrame.occupiedBounds;
      context.strokeStyle = "#71E1DB";
      context.lineWidth = 1;
      context.strokeRect(
        originX + bounds.x * scale + 0.5,
        originY + bounds.y * scale + 0.5,
        bounds.w * scale - 1,
        bounds.h * scale - 1,
      );
      const [pivotX, pivotY] = recipe.frame.pivot;
      context.strokeStyle = "#F7C86A";
      context.beginPath();
      context.moveTo(originX + pivotX * scale - 5, originY + pivotY * scale + 0.5);
      context.lineTo(originX + pivotX * scale + 5, originY + pivotY * scale + 0.5);
      context.moveTo(originX + pivotX * scale + 0.5, originY + pivotY * scale - 5);
      context.lineTo(originX + pivotX * scale + 0.5, originY + pivotY * scale + 5);
      context.stroke();
    }
  }, [frame, grayscale, grid, progress, recipe, showBounds]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={300}
      className="effect-preview"
      aria-label={`Pixel preview for ${recipe.id}`}
    />
  );
}
