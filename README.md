# TileForge Effect Forge

TileForge Effect Forge is a deterministic, recipe-driven pixel-effect authoring
tool. It connects three surfaces:

- **Effect Author** for effect contracts, frames, and semantic channels;
- **Combat Lab** for fixed-density readability and hitbox-truth inspection;
- **Pack Review** for gate status, validation, and deterministic export.

The current `0.1.0` build is an **EF-0 contract candidate with the complete
Tier 1 recipe roster**. It intentionally does not claim the EF-1 visual gate
while real map/actor fixtures and socket approvals remain open.

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

The app renders all 17 Tier 1 recipes, including all seven player and hostile
projectile silhouettes, both ground-telegraph classes, and the complete feedback
set. It includes five synthetic stress backgrounds,
greyscale, hitbox-truth and layer-order modes, deterministic frame scrubbing,
actor socket editing, recipe JSON inspection, PNG evidence capture, canonical
pack export/re-import, and an A/B/C hostile-ramp Visual Grammar board.

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
- Hostile ramp B, **Vermilion Flare**, is approved and locked behind the
  canonical `hostile-hot-core-v1` family ID.

See [docs/ROADMAP.md](docs/ROADMAP.md) for scope and gate status.
The active palette review is documented in
[docs/VISUAL_GRAMMAR_REVIEW.md](docs/VISUAL_GRAMMAR_REVIEW.md).
