import type { Page, Route, Request } from "@playwright/test";

export type RouteInterceptor = {
  assertSeen: (expected?: number) => void;
  seen: () => number;
  unroute: () => Promise<void>;
};

export type HeldRequestOutcome =
  | "pending"
  | "fulfilled"
  | "aborted"
  | "canceled-by-navigation";

export type HeldRouteInterceptor = RouteInterceptor & {
  waitUntilHeld: () => Promise<void>;
  release: () => void;
  waitUntilSettled: () => Promise<void>;
  getOutcome: () => HeldRequestOutcome;
  finalize: () => Promise<HeldRequestOutcome>;
  heldCount: () => number;
  passthroughCount: () => number;
  assertHeldOnce: () => void;
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

export async function interceptHeldNext(
  page: Page,
  predicate: (url: string, method: string) => boolean,
): Promise<HeldRouteInterceptor> {
  let outcome: HeldRequestOutcome = "pending";
  let held = false;
  let released = false;
  let heldTargetCount = 0;
  let passThroughCount = 0;
  let heldResolve!: () => void;
  const heldPromise = new Promise<void>((resolve) => {
    heldResolve = resolve;
  });
  let releaseResolve!: () => void;
  const releasePromise = new Promise<void>((resolve) => {
    releaseResolve = resolve;
  });
  let settledResolve!: () => void;
  const settledPromise = new Promise<void>((resolve) => {
    settledResolve = resolve;
  });

  const onNavigate = () => {
    if (held && !released && outcome === "pending") {
      outcome = "canceled-by-navigation";
      releaseResolve();
    }
  };
  page.on("framenavigated", onNavigate);

  const interceptor = await interceptMatching(
    page,
    predicate,
    async (route, _request, index) => {
      if (index !== 0) {
        passThroughCount += 1;
        await route.continue();
        return;
      }

      if (heldTargetCount > 0) {
        passThroughCount += 1;
        await route.continue();
        return;
      }

      heldTargetCount = 1;
      held = true;
      heldResolve();

      try {
        await releasePromise;

        if (outcome === "canceled-by-navigation") {
          try {
            await route.abort("aborted");
          } catch {
            // Route may already be detached after navigation.
          }
          settledResolve();
          return;
        }

        await route.continue();
        outcome = "fulfilled";
        settledResolve();
      } catch (error) {
        if (outcome === "pending") {
          outcome = "aborted";
        }
        settledResolve();
        throw error;
      }
    },
  );

  const release = () => {
    if (!released) {
      released = true;
      releaseResolve();
    }
  };

  return {
    ...interceptor,
    waitUntilHeld: () => heldPromise,
    release,
    waitUntilSettled: () => settledPromise,
    getOutcome: () => outcome,
    heldCount: () => heldTargetCount,
    passthroughCount: () => passThroughCount,
    assertHeldOnce() {
      if (heldTargetCount !== 1) {
        throw new Error(
          `Expected exactly one held target request; observed ${heldTargetCount}.`,
        );
      }
    },
    finalize: async () => {
      if (outcome === "pending" && held) {
        release();
      }
      await settledPromise.catch(() => undefined);
      page.off("framenavigated", onNavigate);
      return outcome;
    },
  };
}

export const isSavedList = (url: string, method: string): boolean =>
  method === "GET" &&
  url.includes("/rest/v1/job_analyses") &&
  url.includes("select=");

export const isSavedDelete = (url: string, method: string): boolean =>
  method === "DELETE" && url.includes("/rest/v1/job_analyses");

export async function fulfillSyntheticPostgrestFailure(
  route: Route,
): Promise<void> {
  await route.fulfill({
    status: 503,
    contentType: "application/json",
    headers: {
      "cache-control": "no-store",
    },
    body: JSON.stringify({
      code: "QA_SYNTHETIC_FAILURE",
      message: "Synthetic Version 23 QA request failure.",
      details: null,
      hint: null,
    }),
  });
}

export function savedDeleteUrlIncludesId(url: string, id: string): boolean {
  return url.includes(`/rest/v1/job_analyses?id=eq.${encodeURIComponent(id)}`);
}
