# TileForge Effect Forge

TileForge Effect Forge is a deterministic, recipe-driven pixel-effect authoring
tool. It connects three surfaces:

- **Effect Author** for effect contracts, frames, and semantic channels;
- **Combat Lab** for fixed-density readability and hitbox-truth inspection;
- **Pack Review** for gate status, validation, and deterministic export.

The current `0.1.0` build is an **EF-0 contract candidate plus internal vertical
slice**. It intentionally does not claim the 17-effect EF-1 visual gate.

## Run it

```powershell
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite. To produce the portable single-file build:

```powershell
npm.cmd run check
npm.cmd run build
```

The distributable is `dist/index.html`; it contains the compiled application,
styles, recipes, and fixtures in one file.

## Current slice

The app renders a player dart, hostile dart and predictive orb, actor-bound
prefire glint, delayed marker and active hazard, flesh hit, blocked spark, and a
pixel damage number. It includes five synthetic stress backgrounds, greyscale,
hitbox-truth and layer-order modes, deterministic frame scrubbing, actor socket
editing, recipe JSON inspection, PNG evidence capture, and canonical pack
export/re-import.

The app embeds the real supplied Actor Forge v2.3.0 adventurer and bandit sheets
for all four themes. Combat socket coordinates remain candidate companion data.
The five map fixtures are deliberately identified as deterministic stand-ins;
TileForge reference-map import remains a Phase A follow-up.

## Contract decisions

- New standalone TypeScript application.
- Engine-neutral export.
- Integer world-pixel collision geometry plus declared `pixelsPerTile`.
- Binary alpha and nearest-neighbor rendering.
- Named world layers only.
- `#1C1520` shared ink from the observed Actor Forge pack.
- Hostile body and hot-core colors are candidates pending visual approval.

See [docs/ROADMAP.md](docs/ROADMAP.md) for scope and gate status.
