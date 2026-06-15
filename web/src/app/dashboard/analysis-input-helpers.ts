/** Demo paste text for hosted analysis — re-exported from fictional demo inputs. */
export {
  DEMO_ANALYSIS_INPUTS,
  type DemoAnalysisInputs,
} from "@/lib/demo-inputs";

import { DEMO_ANALYSIS_INPUTS } from "@/lib/demo-inputs";

/** @deprecated Prefer `DEMO_ANALYSIS_INPUTS.resumeText` */
export const SAMPLE_RESUME_TEXT = DEMO_ANALYSIS_INPUTS.resumeText;

/** @deprecated Prefer `DEMO_ANALYSIS_INPUTS.jobText` */
export const SAMPLE_JOB_TEXT = DEMO_ANALYSIS_INPUTS.jobText;

export function countTextStats(text: string): { characters: number; words: number } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { characters: 0, words: 0 };
  }
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  return { characters: trimmed.length, words };
}

export function formatTextStats(text: string): string {
  const { characters, words } = countTextStats(text);
  if (characters === 0) {
    return "0 words";
  }
  return `${words.toLocaleString()} word${words === 1 ? "" : "s"} · ${characters.toLocaleString()} characters`;
}

/** Max size for transient .txt uploads (about 500 KB). */
export const MAX_TEXT_FILE_BYTES = 512 * 1024;

export type TextFileReadResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

function isPlainTextFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) {
    return true;
  }
  const type = file.type.toLowerCase();
  return type === "text/plain" || type === "";
}

export function validateTextFile(file: File): TextFileReadResult | null {
  if (!isPlainTextFile(file)) {
    return {
      ok: false,
      message:
        "Only plain .txt files are supported. Paste the text instead, or save your document as .txt and try again.",
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      message:
        "That file is empty. Choose a .txt file with content, or paste the text instead.",
    };
  }

  if (file.size > MAX_TEXT_FILE_BYTES) {
    const limitKb = Math.round(MAX_TEXT_FILE_BYTES / 1024);
    return {
      ok: false,
      message: `That file is too large (limit about ${limitKb} KB). Paste a shorter excerpt or split the text.`,
    };
  }

  return null;
}

export async function readTextFile(file: File): Promise<TextFileReadResult> {
  const validationError = validateTextFile(file);
  if (validationError) {
    return validationError;
  }

  try {
    const text = await file.text();
    if (!text.trim()) {
      return {
        ok: false,
        message:
          "That file has no readable text. Choose a non-empty .txt file or paste the content instead.",
      };
    }
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      message:
        "Could not read that file. Try a UTF-8 .txt file or paste the text instead.",
    };
  }
}
