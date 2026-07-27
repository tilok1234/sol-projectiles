import type { ActorCombatBindings } from "../model/types";

export const ACTOR_COMBAT_BINDINGS: ActorCombatBindings = {
  actorPackHash: "858bcf931356e35c1c04f52a2445720ca5589c624851ebb6cbe5ec5e3c859808",
  actors: {
    bandit: {
      s: {
        attack: {
          events: {
            "prefire.begin": 1,
            "attack.release": 2,
          },
          frames: [
            { hand: [14, 18], weaponTip: [18, 16], hurtCenter: [16, 15], groundOrigin: [16, 27] },
            { hand: [15, 17], weaponTip: [19, 14], hurtCenter: [16, 15], groundOrigin: [16, 27] },
            { hand: [16, 18], weaponTip: [21, 18], hurtCenter: [16, 15], groundOrigin: [16, 27] },
            { hand: [15, 19], weaponTip: [18, 21], hurtCenter: [16, 15], groundOrigin: [16, 27] },
          ],
        },
      },
    },
    adventurer: {
      s: {
        attack: {
          events: {
            "prefire.begin": 0,
            "attack.release": 2,
          },
          frames: [
            { hand: [17, 18], weaponTip: [20, 17], hurtCenter: [16, 15], groundOrigin: [16, 27] },
            { hand: [17, 17], weaponTip: [21, 16], hurtCenter: [16, 15], groundOrigin: [16, 27] },
            { hand: [18, 18], weaponTip: [22, 18], hurtCenter: [16, 15], groundOrigin: [16, 27] },
            { hand: [17, 19], weaponTip: [20, 20], hurtCenter: [16, 15], groundOrigin: [16, 27] },
          ],
        },
      },
    },
  },
};
