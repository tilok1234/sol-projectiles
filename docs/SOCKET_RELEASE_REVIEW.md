# Socket and release review

Status: **candidate — no approvals recorded**

The Socket Review view places editable companion-binding markers over the exact
supplied Sprite Forge animation frames. It is the visual evidence surface for
the open exact socket/release gate; it does not silently convert proposals into
approved data.

## Coordinate contract

- Coordinates use a logical 32 × 32 actor cell.
- The origin is the cell's top-left corner.
- Valid coordinates are integer values from 0 through 31.
- Animation and event frame numbers are zero-based.
- Supplied sheets use 64 × 64 cells because the fixture export scale is ×2.
- The binding's actor-pack hash is the imported Sprite Forge manifest SHA-256.

## Candidate cast

| Actor | Sequence | Source row | Frames | Primary anchor | Proposed release |
| --- | --- | ---: | ---: | --- | ---: |
| Ranger | attack-down | 8 | 3 | `weaponTip` | F2 |
| Warlock | cast-down | 12 | 3 | `castOrigin` | F1 |
| Skeleton | attack-down | 8 | 3 | `hand` | F2 |
| Cultist | cast-down | 12 | 2 | `castOrigin` | F1 |
| Corrupt robe | cast-down | 12 | 3 | `castOrigin` | F1 |
| Timber wolf | attack-down | 8 | 2 | `head` | F1 |

The board also shows `hurtCenter` and `groundOrigin` supporting anchors. The
timber wolf uses quadruped-specific centers rather than inherited humanoid
coordinates.

## Review procedure

1. Open **05 Socket Review**.
2. Select each actor.
3. Confirm the gold frame is the action's release/impact moment.
4. Confirm the primary marker touches the intended emission or contact point.
5. Use the frame and X/Y controls to test corrections.
6. Reply with explicit approval or actor-specific changes.

Local edits can be exported as JSON, but they are not persisted back into the
repository and do not count as approval. After approval, the accepted
coordinates should be recorded as an explicit gate decision.

## Combat Lab runtime preview

Combat Lab consumes the exported candidate binding object directly. Select an
actor under **Candidate binding preview**, then use the deterministic timeline
or frame buttons to inspect:

- the real animation frame selected from the candidate row;
- `prefire.begin` spawning the socket-bound glint;
- `attack.release` or `cast.release` spawning the mapped Tier 1 effect;
- the live logical socket and its scene-space position; and
- the cyan or magenta binding-truth cross.

This is runtime integration evidence, not approval. It replaces the earlier
hand-entered `[19, 14]` Combat Lab socket shortcut.
