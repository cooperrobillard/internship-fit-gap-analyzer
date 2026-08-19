/** Server-only global Smart AI operational switch. */
export function isAiFeaturesEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED?.trim() === "true";
}
