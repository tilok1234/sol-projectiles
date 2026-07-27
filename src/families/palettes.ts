export interface SemanticPalette {
  id: string;
  label: string;
  status: "observed" | "candidate";
  ink: string;
  body: string;
  core: string;
  echo: string;
}

export const PALETTES: Record<string, SemanticPalette> = {
  "hostile-hot-core-v1": {
    id: "hostile-hot-core-v1",
    label: "Hostile hot core",
    status: "candidate",
    ink: "#1C1520",
    body: "#9E3047",
    core: "#FFD166",
    echo: "#5C2637",
  },
  "hostile-hot-core-v1-b": {
    id: "hostile-hot-core-v1-b",
    label: "Vermilion flare",
    status: "candidate",
    ink: "#1C1520",
    body: "#B84A3D",
    core: "#FFF0A6",
    echo: "#6D2E32",
  },
  "hostile-hot-core-v1-c": {
    id: "hostile-hot-core-v1-c",
    label: "Violet magma",
    status: "candidate",
    ink: "#1C1520",
    body: "#7D3F68",
    core: "#FFC857",
    echo: "#4C2948",
  },
  "player-subordinate-v1": {
    id: "player-subordinate-v1",
    label: "Player subordinate",
    status: "candidate",
    ink: "#1C1520",
    body: "#4FA6A3",
    core: "#D9F7D8",
    echo: "#2D686A",
  },
  "telegraph-v1": {
    id: "telegraph-v1",
    label: "Telegraph truth",
    status: "candidate",
    ink: "#1C1520",
    body: "#E57A3D",
    core: "#FFE38A",
    echo: "#8B3E35",
  },
  "hazard-v1": {
    id: "hazard-v1",
    label: "Active hazard",
    status: "candidate",
    ink: "#1C1520",
    body: "#B9424F",
    core: "#F6D365",
    echo: "#6F263E",
  },
  "feedback-hit-v1": {
    id: "feedback-hit-v1",
    label: "Contact feedback",
    status: "candidate",
    ink: "#1C1520",
    body: "#E8E0CF",
    core: "#FFF3B0",
    echo: "#9E5A44",
  },
  "feedback-block-v1": {
    id: "feedback-block-v1",
    label: "Blocked feedback",
    status: "candidate",
    ink: "#1C1520",
    body: "#9097A1",
    core: "#D7DCE2",
    echo: "#555B66",
  },
  "combat-text-v1": {
    id: "combat-text-v1",
    label: "Combat text",
    status: "candidate",
    ink: "#1C1520",
    body: "#F3E7C2",
    core: "#FFFFFF",
    echo: "#6D5360",
  },
};

export const SHARED_ACTOR_INK = "#1C1520";

export const HOSTILE_RAMP_CANDIDATES = [
  {
    key: "A",
    id: "hostile-hot-core-v1",
    label: "Crimson ember",
    note: "Balanced body mass with a warm core.",
  },
  {
    key: "B",
    id: "hostile-hot-core-v1-b",
    label: "Vermilion flare",
    note: "Higher snow contrast and the brightest core.",
  },
  {
    key: "C",
    id: "hostile-hot-core-v1-c",
    label: "Violet magma",
    note: "Cooler body separation on corruption maps.",
  },
] as const;

export type HostileRampId = (typeof HOSTILE_RAMP_CANDIDATES)[number]["id"];
