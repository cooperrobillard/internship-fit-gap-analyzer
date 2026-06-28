import { expect, type Locator, type Page } from "@playwright/test";
import { shouldClickOptionalJobSummary } from "./analysis-form";

export const SAVED_JOB_DETAILS_DISCLOSURE_TIMEOUT_MS = 15_000;

export const SAVED_JOB_DETAILS_SUMMARY_PATTERN =
  /^Job details(?: · Notes included)?$/;

export function isSavedJobDetailsSummary(text: string): boolean {
  return SAVED_JOB_DETAILS_SUMMARY_PATTERN.test(text.trim());
}

export function validateVisibleSavedAnalysisArticleCount(count: number): void {
  if (count === 0) {
    throw new Error("Visible saved-analysis detail article was not found.");
  }
  if (count > 1) {
    throw new Error("Multiple visible saved-analysis detail articles were found.");
  }
}

export function validateSavedJobDetailsDisclosureCount(count: number): void {
  if (count === 0) {
    throw new Error("Saved Job details disclosure was not found.");
  }
  if (count > 1) {
    throw new Error("Multiple saved Job details disclosures were found.");
  }
}

export function visibleSavedAnalysisDetailArticle(
  page: Page,
  analysisTitle: string,
): Locator {
  return page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        level: 2,
        name: analysisTitle,
        exact: true,
      }),
    })
    .filter({ visible: true });
}

export function savedJobDetailsDisclosure(article: Locator): Locator {
  return article
    .locator("details")
    .filter({
      has: article.locator("summary").filter({
        hasText: SAVED_JOB_DETAILS_SUMMARY_PATTERN,
      }),
    })
    .filter({ visible: true });
}

export async function openSavedAnalysisJobDetails(
  page: Page,
  analysisTitle: string,
): Promise<Locator> {
  const articles = visibleSavedAnalysisDetailArticle(page, analysisTitle);
  validateVisibleSavedAnalysisArticleCount(await articles.count());

  const article = articles.first();
  const disclosures = savedJobDetailsDisclosure(article);
  validateSavedJobDetailsDisclosureCount(await disclosures.count());

  const details = disclosures.first();
  const isOpen = await details.evaluate(
    (element) => (element as HTMLDetailsElement).open,
  );

  if (shouldClickOptionalJobSummary(isOpen)) {
    await details.locator("summary").click({
      timeout: SAVED_JOB_DETAILS_DISCLOSURE_TIMEOUT_MS,
    });
  }

  try {
    await expect(details).toHaveAttribute("open", "", {
      timeout: SAVED_JOB_DETAILS_DISCLOSURE_TIMEOUT_MS,
    });
  } catch {
    throw new Error("Saved Job details disclosure did not open.");
  }

  return details;
}
