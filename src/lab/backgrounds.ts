import type { BackgroundId } from "../model/types";

interface BackgroundPalette {
  base: string;
  tileA: string;
  tileB: string;
  detail: string;
  line: string;
}

const PALETTES: Record<BackgroundId, BackgroundPalette> = {
  meadow: {
    base: "#243D2C",
    tileA: "#31533A",
    tileB: "#294632",
    detail: "#4E6A3B",
    line: "#1B3025",
  },
  dungeon: {
    base: "#11101A",
    tileA: "#1B1825",
    tileB: "#24202D",
    detail: "#30293B",
    line: "#0B0A10",
  },
  snow: {
    base: "#B8C4C6",
    tileA: "#D2D9D5",
    tileB: "#AAB9BC",
    detail: "#839AA2",
    line: "#637782",
  },
  corruption: {
    base: "#211224",
    tileA: "#321A35",
    tileB: "#26162D",
    detail: "#59304E",
    line: "#160D1C",
  },
  boss: {
    base: "#17141C",
    tileA: "#211C29",
    tileB: "#2A222E",
    detail: "#513536",
    line: "#0D0B10",
  },
};

export const BACKGROUND_LABELS: Record<BackgroundId, string> = {
  meadow: "Open meadow · forest",
  dungeon: "Dark dungeon · forest",
  snow: "Snow settlement · winter",
  corruption: "Corruption frontier · dusk",
  boss: "Boss arena · forest",
};

export const drawBackground = (
  context: CanvasRenderingContext2D,
  id: BackgroundId,
  width: number,
  height: number,
): void => {
  const palette = PALETTES[id];
  context.fillStyle = palette.base;
  context.fillRect(0, 0, width, height);
  const tile = 16;
  for (let y = 0; y < height; y += tile) {
    for (let x = 0; x < width; x += tile) {
      context.fillStyle = ((x / tile + y / tile) & 1) === 0 ? palette.tileA : palette.tileB;
      context.fillRect(x, y, tile, tile);
      context.fillStyle = palette.line;
      context.fillRect(x, y + tile - 1, tile, 1);
      context.fillRect(x + tile - 1, y, 1, tile);
      if (((x * 7 + y * 11) / tile) % 5 < 1) {
        context.fillStyle = palette.detail;
        context.fillRect(x + 3, y + 4, 2, 1);
        context.fillRect(x + 5, y + 3, 1, 3);
      }
    }
  }
  if (id === "boss") {
    context.strokeStyle = palette.detail;
    context.lineWidth = 2;
    context.strokeRect(30, 22, width - 60, height - 44);
    context.strokeRect(38, 30, width - 76, height - 60);
  }
};
