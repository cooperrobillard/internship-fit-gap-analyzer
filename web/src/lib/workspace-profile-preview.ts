export const WORKSPACE_PROFILE_PREVIEW_SKILL_LIMIT = 8;

export function getWorkspaceProfilePreviewSkills(
  skills: string[],
  limit: number = WORKSPACE_PROFILE_PREVIEW_SKILL_LIMIT,
): { visible: string[]; hiddenCount: number } {
  const visible = skills.slice(0, limit);
  return {
    visible,
    hiddenCount: Math.max(0, skills.length - visible.length),
  };
}
