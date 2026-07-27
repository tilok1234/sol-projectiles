export interface Tier1Entry {
  id: string;
  label: string;
  audioId: string;
  status: "slice" | "planned";
}

export const TIER_1_ROSTER: Tier1Entry[] = [
  {
    id: "player.accurate-shot",
    label: "Accurate shot",
    audioId: "sfx.player.accurate_release",
    status: "slice",
  },
  {
    id: "player.spread-pellet",
    label: "Spread pellet",
    audioId: "sfx.player.spread_volley",
    status: "planned",
  },
  {
    id: "player.pierce-return",
    label: "Pierce return",
    audioId: "sfx.player.pierce_release",
    status: "planned",
  },
  {
    id: "hostile.aimed-dart",
    label: "Aimed dart",
    audioId: "sfx.hostile.aimed_dart_release",
    status: "slice",
  },
  {
    id: "hostile.predictive-orb",
    label: "Predictive orb",
    audioId: "sfx.hostile.predictive_orb_release",
    status: "slice",
  },
  {
    id: "hostile.fan-crescent",
    label: "Fan crescent",
    audioId: "sfx.hostile.fan_release",
    status: "planned",
  },
  {
    id: "hostile.radial-shard",
    label: "Radial shard",
    audioId: "sfx.hostile.radial_burst",
    status: "planned",
  },
  {
    id: "telegraph.chaser-lunge",
    label: "Chaser lunge",
    audioId: "sfx.telegraph.lunge_windup",
    status: "planned",
  },
  {
    id: "telegraph.prefire-glint",
    label: "Prefire glint",
    audioId: "sfx.telegraph.shooter_glint",
    status: "slice",
  },
  {
    id: "telegraph.delayed-ground",
    label: "Delayed ground",
    audioId: "sfx.telegraph.ground_arm",
    status: "slice",
  },
  {
    id: "telegraph.elite-cast",
    label: "Elite cast",
    audioId: "sfx.telegraph.elite_charge",
    status: "planned",
  },
  {
    id: "feedback.hit-contact",
    label: "Hit contact",
    audioId: "sfx.feedback.hit_flesh",
    status: "slice",
  },
  {
    id: "feedback.blocked-immune",
    label: "Blocked / immune",
    audioId: "sfx.feedback.blocked_deflect",
    status: "slice",
  },
  {
    id: "feedback.kill-pop",
    label: "Kill pop",
    audioId: "sfx.feedback.kill_pop",
    status: "planned",
  },
  {
    id: "feedback.player-hurt",
    label: "Player hurt",
    audioId: "sfx.feedback.player_hurt",
    status: "planned",
  },
  {
    id: "feedback.damage-number",
    label: "Damage number",
    audioId: "sfx.feedback.damage_number",
    status: "slice",
  },
  {
    id: "zone.active-ground-hazard",
    label: "Active ground hazard",
    audioId: "sfx.zone.active_hazard_loop",
    status: "slice",
  },
];
