/**
 * Derive a readable default profile name from an uploaded filename.
 * Used for file-upload profile creation; pasted text uses candidate-name extraction.
 */

function formatProfileNameWord(word: string): string {
  if (!word) {
    return "";
  }
  if (/^v\d+$/i.test(word)) {
    return word.toLowerCase();
  }
  if (/^\d+$/.test(word)) {
    return word;
  }
  if (word.toUpperCase() === word && word.length <= 4) {
    return word;
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Strip extension and normalize separators into a title-like profile name. */
export function deriveProfileNameFromFilename(filename: string): string {
  const trimmed = filename.trim();
  if (!trimmed) {
    return "Resume profile";
  }

  const lastSlash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const basename = lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
  const lastDot = basename.lastIndexOf(".");
  const stem = lastDot > 0 ? basename.slice(0, lastDot) : basename;

  const cleaned = stem
    .replace(/[_\-]+/g, " ")
    .replace(/[^\w\s.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Resume profile";
  }

  return cleaned
    .split(" ")
    .map((word) => formatProfileNameWord(word))
    .join(" ");
}

/** Choose the editable default profile name for create/review flows. */
export function resolveDefaultProfileName(options: {
  filename?: string;
  candidateName?: string;
  ruleBasedSuggestedName?: string;
}): string {
  if (options.filename?.trim()) {
    return deriveProfileNameFromFilename(options.filename);
  }

  const candidateName = options.candidateName?.trim();
  if (candidateName) {
    return candidateName;
  }

  const ruleBased = options.ruleBasedSuggestedName?.trim();
  return ruleBased || "Resume profile";
}
