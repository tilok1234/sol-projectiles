import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import actorBindingsSchema from "../../contracts/actor-combat-bindings.schema.json";
import audioRosterSchema from "../../contracts/audio-roster.schema.json";
import effectPackSchema from "../../contracts/effect-pack.schema.json";
import effectRecipeSchema from "../../contracts/effect-recipe.schema.json";
import { PALETTES } from "../families/palettes";
import type { EffectPack, EffectRecipe } from "../model/types";

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(actorBindingsSchema);
ajv.addSchema(audioRosterSchema);
const validateRecipeSchema = ajv.compile(effectRecipeSchema);
const validatePackSchema = ajv.compile(effectPackSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  checks: Array<{ label: string; passed: boolean }>;
}

const formatErrors = (errors: ErrorObject[] | null | undefined): string[] =>
  (errors ?? []).map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message ?? "is invalid"}`;
  });

export const validateRecipe = (recipe: EffectRecipe): ValidationResult => {
  const schemaValid = validateRecipeSchema(recipe);
  const palette = PALETTES[recipe.render.treatment];
  const hostileLocks =
    recipe.allegiance !== "hostile" ||
    recipe.class !== "projectile" ||
    (recipe.family === "hostile-hot-core-v1" &&
      recipe.themePolicy === "identity-locked" &&
      recipe.render.treatment === "hostile-hot-core-v1");
  const rotatableContract =
    recipe.rotation.mode === "none" ||
    (recipe.frame.forward.some((value) => value !== 0) &&
      recipe.rotation.sampling === "nearest");
  const namedAudio = recipe.audio.length > 0 && recipe.audio.every((cue) => cue.id.startsWith("sfx."));
  const checks = [
    { label: "Schema", passed: Boolean(schemaValid) },
    { label: "Known semantic treatment", passed: Boolean(palette) },
    { label: "Hostile family locks", passed: hostileLocks },
    { label: "Rotation contract", passed: rotatableContract },
    { label: "Named audio sibling", passed: namedAudio },
    { label: "Binary alpha + normal blend", passed: recipe.render.alpha === "binary" && recipe.render.blend === "normal" },
  ];
  const extraErrors = checks
    .filter((check) => !check.passed)
    .map((check) => `${check.label} check failed`);
  const errors = [...formatErrors(validateRecipeSchema.errors), ...extraErrors];
  return { valid: errors.length === 0, errors, checks };
};

export const validatePack = (pack: EffectPack): ValidationResult => {
  const schemaValid = validatePackSchema(pack);
  const idsMatchHashes = pack.effectIds.every((id) => Boolean(pack.recipeHashes[id]));
  const sortedIds = [...pack.effectIds].sort((a, b) => a.localeCompare(b));
  const canonicalOrder = pack.effectIds.every((id, index) => id === sortedIds[index]);
  const checks = [
    { label: "Pack schema", passed: Boolean(schemaValid) },
    { label: "Every recipe has SHA-256", passed: idsMatchHashes },
    { label: "Canonical effect order", passed: canonicalOrder },
    { label: "Integer pixels per tile", passed: Number.isInteger(pack.pixelsPerTile) },
  ];
  const errors = [
    ...formatErrors(validatePackSchema.errors),
    ...checks.filter((check) => !check.passed).map((check) => `${check.label} check failed`),
  ];
  return { valid: errors.length === 0, errors, checks };
};
