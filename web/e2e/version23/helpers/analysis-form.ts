import { expect, type Locator, type Page } from "@playwright/test";

export const OPTIONAL_DETAILS_DISCLOSURE_TIMEOUT_MS = 15_000;
export const OPTIONAL_DETAILS_FIELD_TIMEOUT_MS = 10_000;

export const OPTIONAL_JOB_FIELD_LABELS = ["Job title", "Company", "Notes"] as const;
export type OptionalJobFieldLabel = (typeof OPTIONAL_JOB_FIELD_LABELS)[number];

export function validateOptionalJobDisclosureCount(count: number): void {
  if (count === 0) {
    throw new Error("Optional job details disclosure was not found.");
  }
  if (count > 1) {
    throw new Error("Multiple Optional job details disclosures were found.");
  }
}

export function shouldClickOptionalJobSummary(isOpen: boolean): boolean {
  return !isOpen;
}

export function optionalJobDetails(page: Page): Locator {
  return page.locator("details").filter({
    has: page.locator("summary").getByText("Optional job details", {
      exact: true,
    }),
  });
}

async function assertOptionalJobFieldReady(
  details: Locator,
  label: OptionalJobFieldLabel,
  visibilityMessage: string,
  editableMessage: string,
): Promise<Locator> {
  const field = details.getByLabel(label);
  try {
    await expect(field).toBeVisible({
      timeout: OPTIONAL_DETAILS_FIELD_TIMEOUT_MS,
    });
  } catch {
    throw new Error(visibilityMessage);
  }
  try {
    await expect(field).toBeEditable({
      timeout: OPTIONAL_DETAILS_FIELD_TIMEOUT_MS,
    });
  } catch {
    throw new Error(editableMessage);
  }
  return field;
}

export async function assertOptionalJobFieldsReady(details: Locator): Promise<void> {
  await assertOptionalJobFieldReady(
    details,
    "Job title",
    "Job title was not visible after opening Optional job details.",
    "Job title was not editable after opening Optional job details.",
  );
  await assertOptionalJobFieldReady(
    details,
    "Company",
    "Company was not visible after opening Optional job details.",
    "Company was not editable after opening Optional job details.",
  );
  await assertOptionalJobFieldReady(
    details,
    "Notes",
    "Notes was not visible after opening Optional job details.",
    "Notes was not editable after opening Optional job details.",
  );
}

export async function openOptionalJobDetails(page: Page): Promise<Locator> {
  const disclosures = optionalJobDetails(page);
  validateOptionalJobDisclosureCount(await disclosures.count());

  const details = disclosures.first();
  const isOpen = await details.evaluate(
    (element) => (element as HTMLDetailsElement).open,
  );

  if (shouldClickOptionalJobSummary(isOpen)) {
    await details.locator("summary").click({
      timeout: OPTIONAL_DETAILS_DISCLOSURE_TIMEOUT_MS,
    });
  }

  try {
    await expect(details).toHaveAttribute("open", "", {
      timeout: OPTIONAL_DETAILS_DISCLOSURE_TIMEOUT_MS,
    });
  } catch {
    throw new Error("Optional job details did not open.");
  }

  await assertOptionalJobFieldsReady(details);
  return details;
}

export async function fillOptionalJobMetadata(
  details: Locator,
  values: { title: string; company: string; notes: string },
): Promise<void> {
  const jobTitle = await assertOptionalJobFieldReady(
    details,
    "Job title",
    "Job title was not visible after opening Optional job details.",
    "Job title was not editable after opening Optional job details.",
  );
  const company = await assertOptionalJobFieldReady(
    details,
    "Company",
    "Company was not visible after opening Optional job details.",
    "Company was not editable after opening Optional job details.",
  );
  const notes = await assertOptionalJobFieldReady(
    details,
    "Notes",
    "Notes was not visible after opening Optional job details.",
    "Notes was not editable after opening Optional job details.",
  );

  await jobTitle.fill(values.title);
  await company.fill(values.company);
  await notes.fill(values.notes);
}
