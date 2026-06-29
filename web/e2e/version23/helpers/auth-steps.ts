import { test } from "@playwright/test";

export type StepRunner = <T>(
  title: string,
  body: () => Promise<T>,
) => Promise<T>;

export const directStepRunner: StepRunner = async (_title, body) => body();

export const playwrightStepRunner: StepRunner = async (title, body) =>
  test.step(title, body);

export async function runAuthStep<T>(
  title: string,
  body: () => Promise<T>,
  stepRunner: StepRunner = playwrightStepRunner,
): Promise<T> {
  return stepRunner(title, body);
}
