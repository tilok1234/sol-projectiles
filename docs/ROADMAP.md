# Effect Forge roadmap

This repository implements the supplied TileForge Effect Forge contract and
build plan in approval-gated slices.

## Current milestone: `0.1.0`

Target: Gate EF-0 candidate plus the internal vertical slice.

- [x] Named world-layer enum
- [x] Effect recipe, pack, actor binding, and audio roster schemas
- [x] Candidate semantic palettes and hostile family locks
- [x] Integer mask renderer and exact-area geometry
- [x] Deterministic canonical JSON and SHA-256 hashing
- [x] Internal representative effect roster
- [x] All seven Tier 1 projectile silhouettes
- [x] A/B/C hostile-ramp visual grammar board
- [x] Effect Author shell
- [x] Combat Lab with fixed synthetic density fixture
- [x] Pack Review completeness matrix
- [x] Supplied Actor Forge v2.3.0 adventurer/bandit fixtures embedded
- [x] Supplied 231-actor Sprite Forge corpus imported read-only
- [x] Six representative actor archetypes live in Combat Lab
- [x] Real TileForge RD7 reference-map fixture import
- [ ] User-facing Sprite Forge ZIP importer
- [x] Final hostile ramp approval: B — Vermilion Flare
- [ ] Exact actor socket/release binding approval
- [ ] EF-0 explicit approval

## EF-1: Tier 1 lab opens

EF-1 requires all 17 Tier 1 effects, real actor/map fixtures, deterministic
pack compilation, greyscale role identification, telegraph/collision equality,
and explicit visual approval. Structural tests never substitute for that review.

The current implementation count is 17/17. Chaser lunge and elite cast reuse
recipe geometry as visible telegraph truth; kill pop remains local and brief;
player hurt is a directional actor-centered wedge with no full-screen flash.

EF-1 remains closed until exact socket/release bindings, representative actor-cast
approval, deterministic evidence pack, and explicit final visual approval are
complete.

## Deferred by contract

- Tier 2 guard/healer/boss grammar
- Tier 3 trails, portal, level-up, loot beam, and quest markers
- Engine-specific importers
- Audio files (the current contract stores named audio siblings only)
