/** Demo paste text for hosted analysis — generic, not real private resumes. */
export const SAMPLE_RESUME_TEXT = `Skills: Python, SQL, Git, data analysis, REST APIs, teamwork.
Experience: Class projects using pandas and FastAPI; collaborated in a 4-person team.
Education: Computer Science student seeking an internship.`;

export const SAMPLE_JOB_TEXT = `Software Engineering Intern

Requirements:
- Python and SQL for data tasks
- Git and collaborative development
- FastAPI or similar web frameworks
- Clear written communication

Nice to have: cloud basics, pandas, internship or co-op experience.`;

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
