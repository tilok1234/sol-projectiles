import type { AudioRoster } from "../model/types";
import { TIER_1_ROSTER } from "./tier1";

export const AUDIO_ROSTER: AudioRoster = {
  version: "0.1.0",
  cues: TIER_1_ROSTER.map((entry) => ({
    id: entry.audioId,
    status: "named-only",
  })),
};
