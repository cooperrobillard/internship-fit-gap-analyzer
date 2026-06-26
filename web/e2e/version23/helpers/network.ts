import type { Page, Route, Request } from "@playwright/test";

export type RouteInterceptor = {
  assertSeen: (expected?: number) => void;
  seen: () => number;
  unroute: () => Promise<void>;
};

export async function interceptMatching(
  page: Page,
  predicate: (url: string, method: string) => boolean,
  action: (route: Route, request: Request, index: number) => Promise<void> | void,
): Promise<RouteInterceptor> {
  let seen = 0;
  const handler = async (route: Route, request: Request) => {
    if (predicate(request.url(), request.method())) {
      const index = seen;
      seen += 1;
      await action(route, request, index);
      return;
    }
    await route.continue();
  };
  await page.route("**/*", handler);
  return {
    assertSeen(expected = 1) {
      if (seen !== expected) {
        throw new Error(
          `Expected route matcher to fire ${expected} time(s); observed ${seen}.`,
        );
      }
    },
    seen: () => seen,
    unroute: async () => {
      await page.unroute("**/*", handler);
    },
  };
}

export async function interceptNext(
  page: Page,
  predicate: (url: string, method: string) => boolean,
  action: (route: Route, request: Request) => Promise<void> | void,
): Promise<RouteInterceptor> {
  return interceptMatching(page, predicate, async (route, request, index) => {
    if (index === 0) {
      await action(route, request);
      return;
    }
    await route.continue();
  });
}

export const isSavedList = (url: string, method: string): boolean =>
  method === "GET" &&
  url.includes("/rest/v1/job_analyses") &&
  url.includes("select=");

export const isSavedDelete = (url: string, method: string): boolean =>
  method === "DELETE" && url.includes("/rest/v1/job_analyses");

export function savedDeleteUrlIncludesId(url: string, id: string): boolean {
  return url.includes(`/rest/v1/job_analyses?id=eq.${encodeURIComponent(id)}`);
}
