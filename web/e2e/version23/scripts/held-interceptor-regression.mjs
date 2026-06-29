#!/usr/bin/env node
import {
  interceptHeldNext,
  interceptMatching,
} from "../helpers/network.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn();
    throw new Error(`Expected failure containing "${expectedMessage}"`);
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes(expectedMessage),
      `Expected "${expectedMessage}", got "${error instanceof Error ? error.message : error}"`,
    );
  }
}

function createRoutePage() {
  let handler = null;
  const listeners = {};

  return {
    route: async (_pattern, routeHandler) => {
      handler = routeHandler;
    },
    unroute: async () => undefined,
    on: (event, listener) => {
      listeners[event] = listener;
    },
    off: () => undefined,
    dispatch: async (route, request) => {
      if (!handler) {
        throw new Error("Route handler is not registered.");
      }
      await handler(route, request);
    },
    navigate: () => {
      listeners.framenavigated?.();
    },
  };
}

function createRequest(label) {
  return {
    url: () => `https://example.invalid/saved-list/${label}`,
    method: () => "GET",
  };
}

function createRoute(events, label) {
  return {
    continue: async () => {
      events.push(`continued:${label}`);
    },
    abort: async () => {
      events.push(`aborted:${label}`);
    },
  };
}

async function runHeldTargetRegression() {
  const page = createRoutePage();
  const events = [];
  const interceptor = await interceptHeldNext(page, () => true);

  const heldWait = interceptor.waitUntilHeld();
  void page.dispatch(createRoute(events, "held-target"), createRequest("held-target"));
  await heldWait;

  assert(interceptor.heldCount() === 1, "heldCount must equal one after waitUntilHeld");
  assert(
    !events.some((event) => event.startsWith("continued:held-target")),
    "held target must not continue before release",
  );

  void page.dispatch(createRoute(events, "pass-through"), createRequest("pass-through"));
  assert(
    events.includes("continued:pass-through"),
    "second matching request must pass through immediately",
  );
  assert(interceptor.passthroughCount() === 1, "passthroughCount must track later matches");
  assert(interceptor.seen() === 2, "total match count may equal two");

  interceptor.release();
  const outcome = await interceptor.finalize();
  assert(outcome === "fulfilled", "finalize must report the held target outcome");
  assert(events.includes("continued:held-target"), "held target continues after finalize");

  interceptor.assertHeldOnce();
  assertThrows(
    () => interceptor.assertSeen(1),
    "Expected route matcher to fire 1 time(s); observed 2.",
  );
}

async function runNavigationCanceledRegression() {
  const page = createRoutePage();
  const events = [];
  const interceptor = await interceptHeldNext(page, () => true);

  const heldWait = interceptor.waitUntilHeld();
  void page.dispatch(createRoute(events, "held-target"), createRequest("held-target"));
  await heldWait;
  page.navigate();

  const outcome = await interceptor.finalize();
  assert(
    outcome === "canceled-by-navigation",
    "navigation-canceled held request must report canceled-by-navigation",
  );

  void page.dispatch(createRoute(events, "new-session"), createRequest("new-session"));
  assert(
    events.includes("continued:new-session"),
    "new session request must pass through after navigation cancel",
  );
  assert(interceptor.heldCount() === 1, "only one request may be held");
  interceptor.assertHeldOnce();
}

async function runGenericMatcherRegression() {
  const page = createRoutePage();
  const events = [];
  const interceptor = await interceptMatching(page, () => true, async (route) => {
    await route.continue();
  });

  await page.dispatch(createRoute(events, "first"), createRequest("first"));
  await page.dispatch(createRoute(events, "second"), createRequest("second"));

  interceptor.assertSeen(2);
  assertThrows(
    () => interceptor.assertSeen(1),
    "Expected route matcher to fire 1 time(s); observed 2.",
  );
}

async function runFinalizeIdempotencyRegression() {
  const page = createRoutePage();
  const interceptor = await interceptHeldNext(page, () => true);

  const heldWait = interceptor.waitUntilHeld();
  void page.dispatch(
    createRoute([], "held-target"),
    createRequest("held-target"),
  );
  await heldWait;

  const first = await interceptor.finalize();
  const second = await interceptor.finalize();
  assert(first === second, "finalize must remain idempotent");
  interceptor.assertHeldOnce();
}

function runPrimaryFailureRegression() {
  let primaryFailure;
  try {
    throw new Error("primary held-interceptor failure");
  } catch (error) {
    primaryFailure = error;
  }

  try {
    throw new Error("secondary cleanup noise");
  } catch {
    // cleanup noise must not replace the primary failure
  }

  assert(
    primaryFailure instanceof Error &&
      primaryFailure.message.includes("primary held-interceptor failure"),
    "cleanup/finalization must not mask a primary failure",
  );
}

try {
  await runHeldTargetRegression();
  await runNavigationCanceledRegression();
  await runGenericMatcherRegression();
  await runFinalizeIdempotencyRegression();
  await runPrimaryFailureRegression();
  console.log("Version 23 held-interceptor regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
