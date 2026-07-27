# Supplied fixture import

Status: **copied and integrated**

## Sprite Forge

Imported from the supplied `Sprite_Assembler/.../sprite-pack` folder into
`src/fixtures/sprite-forge-full`.

- 243 files
- 241 PNG sheets
- 6,695,380 bytes
- manifest SHA-256:
  `1D93D0F3D96A7C92D284891F39B90D602AE721C84742B78EBE3F598587EE1549`
- 231 manifest-backed actors
- 12 players, 6 NPCs, 4 vendors, 128 enemies, and 34 bosses
- 12 props, 20 projectiles, and 15 supplied effects

Combat Lab currently exposes six representative sheets:

- ranger
- warlock
- skeleton
- cultist
- corrupt robe
- timber wolf

The complete pack remains read-only fixture evidence. Effect Forge does not
rewrite or regenerate the supplied sheets.

## TileForge

Imported the purpose-built `tileforge-reference-pack/reference` corpus into
`src/fixtures/tileforge-reference`, plus the supplied
`showcase-rich.tileforge.json`.

- 91 files including the showcase recipe
- 13 focused scenes across four themes
- three flagship worlds across four themes
- source engine commit `199ed7d`
- manifest SHA-256:
  `9CD76BB4C098D4E3ECBAC0D4622598DE4EEFB6F1541D5078D1332324B74AADB6`

Combat Lab maps its five stress conditions to real fixtures:

- forest clearing · forest
- dungeon room · forest
- snowfield · winter
- corrupt zone · dusk
- Thornhollow flagship · forest

The four approximately 30 MB complete tileset exports were intentionally not
duplicated into this repository. The reference corpus is the source package's
documented cross-forge contract and contains the rendered evidence needed here.
