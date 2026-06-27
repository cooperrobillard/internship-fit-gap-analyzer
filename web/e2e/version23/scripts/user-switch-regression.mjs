#!/usr/bin/env node
import { directStepRunner, runAuthStep } from "../helpers/auth-steps.ts";
import { switchQaUserOnPage } from "../helpers/auth-switch.ts";
import { interceptHeldNext } from "../helpers/network.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertRejects(promise, expectedMessage) {
  return promise.then(
    () => {
      throw new Error(`Expected rejection: ${expectedMessage}`);
    },
    (error) => {
      assert(
        error instanceof Error && error.message.includes(expectedMessage),
        `Expected "${expectedMessage}", got "${error instanceof Error ? error.message : error}"`,
      );
    },
  );
}

const qaUserIds = { A: "user_a", B: "user_b" };
const config = {
  baseUrl: "https://example.invalid",
  userAEmail: "qa-a@example.invalid",
  userBEmail: "qa-b@example.invalid",
};

function createSwitchPage(initialUserId = "user_a") {
  let activeUserId = initialUserId;
  let currentUrl = "https://example.invalid/dashboard/saved";
  const navigations = [];
  const listeners = new Map();

  const page = {
    url: () => currentUrl,
    goto: async (target) => {
      navigations.push(target);
      currentUrl = target;
      for (const listener of listeners.get("framenavigated") ?? []) {
        listener();
      }
      return { status: () => 200 };
    },
    waitForURL: async (predicate) => {
      currentUrl = `${config.baseUrl}/`;
      const parsed = new URL(currentUrl);
      const ok =
        typeof predicate === "function"
          ? predicate(parsed)
          : String(predicate) === currentUrl;
      if (!ok) {
        throw new Error("Unexpected redirect hostname during user switch.");
      }
    },
    waitForFunction: async () => {
      if (activeUserId) {
        throw new Error("still signed in");
      }
    },
    getByRole: (role, options = {}) => ({
      isVisible: async () => {
        const name = String(options.name ?? "");
        if (role === "heading" && /log in to vercel/i.test(name)) {
          return false;
        }
        return true;
      },
      toBeVisible: async () => undefined,
      toHaveCount: async () => undefined,
    }),
    getByText: () => ({
      toHaveCount: async () => undefined,
    }),
    evaluate: async () => activeUserId,
    on: (event, listener) => {
      const current = listeners.get(event) ?? [];
      current.push(listener);
      listeners.set(event, current);
    },
    off: (event, listener) => {
      const current = (listeners.get(event) ?? []).filter((item) => item !== listener);
      listeners.set(event, current);
    },
  };

  return {
    page,
    navigations,
    setActiveUserId: (value) => {
      activeUserId = value;
    },
    getActiveUserId: () => activeUserId,
    setUrl: (value) => {
      currentUrl = value;
    },
  };
}

function createMockClerk(pageState) {
  const calls = [];
  return {
    calls,
    clerk: {
      signOut: async ({ signOutOptions } = {}) => {
        calls.push("signOut");
        if (signOutOptions?.redirectUrl) {
          pageState.setUrl(signOutOptions.redirectUrl);
        }
        pageState.setActiveUserId(null);
      },
      signIn: async () => {
        calls.push("signIn");
        if (pageState.getActiveUserId()) {
          throw new Error("You're already signed in.");
        }
        pageState.setActiveUserId("user_b");
      },
      loaded: async () => undefined,
    },
  };
}

async function runSwitchRegression() {
  const pageState = createSwitchPage("user_a");
  const mock = createMockClerk(pageState);

  await switchQaUserOnPage(pageState.page, config, "A", "B", {
    qaUserIds,
    deps: { clerk: mock.clerk },
    stepRunner: directStepRunner,
    verifySavedUi: false,
  });

  assert(
    mock.calls.indexOf("signOut") < mock.calls.indexOf("signIn"),
    "User B sign-in must not run until User A has signed out",
  );
  assert(
    pageState.getActiveUserId() === "user_b",
    "User B identity must be active after switching",
  );
  assert(
    pageState.page.url().endsWith("/dashboard/saved"),
    "Saved must be opened after User B becomes active",
  );
  assert(
    new URL(pageState.page.url()).pathname === "/dashboard/saved",
    "switch must end on Saved without treating landing redirect as failure",
  );

  const redirectPage = createSwitchPage("user_a");
  const redirectMock = createMockClerk(redirectPage);
  await switchQaUserOnPage(redirectPage.page, config, "A", "B", {
    qaUserIds,
    deps: { clerk: redirectMock.clerk },
    stepRunner: directStepRunner,
    verifySavedUi: false,
  });
  assert(
    redirectMock.calls.includes("signOut"),
    "expected sign-out redirect to / must not fail the switch",
  );

  const badHostPage = createSwitchPage("user_a");
  badHostPage.page.waitForURL = async () => {
    badHostPage.setUrl("https://other.invalid/");
    throw new Error("Unexpected redirect hostname during user switch: other.invalid.");
  };
  await assertRejects(
    switchQaUserOnPage(badHostPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: createMockClerk(badHostPage).clerk },
      stepRunner: directStepRunner,
      verifySavedUi: false,
    }),
    "Unexpected redirect hostname",
  );

  const vercelPage = createSwitchPage("user_a");
  vercelPage.page.getByRole = (role, options = {}) => ({
    isVisible: async () =>
      role === "heading" &&
      /log in to vercel/i.test(String(options.name ?? "")),
  });
  vercelPage.page.waitForURL = async () => {
    vercelPage.setUrl(`${config.baseUrl}/`);
  };
  await assertRejects(
    switchQaUserOnPage(vercelPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: createMockClerk(vercelPage).clerk },
      stepRunner: directStepRunner,
      verifySavedUi: false,
    }),
    "Vercel SSO",
  );

  const signedOutPage = createSwitchPage(null);
  await assertRejects(
    switchQaUserOnPage(signedOutPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: createMockClerk(signedOutPage).clerk },
      stepRunner: directStepRunner,
      verifySavedUi: false,
    }),
    "attempted while signed out",
  );

  const timeoutPage = createSwitchPage("user_a");
  await assertRejects(
    switchQaUserOnPage(timeoutPage.page, config, "A", "B", {
      qaUserIds,
      deps: {
        clerk: {
          signOut: async () => {
            throw new Error("Clerk sign-out timed out while switching from User A.");
          },
          signIn: async () => undefined,
          loaded: async () => undefined,
        },
      },
      stepRunner: directStepRunner,
      verifySavedUi: false,
    }),
    "sign-out timed out while switching from User A",
  );

  const signInTimeoutPage = createSwitchPage("user_a");
  await assertRejects(
    switchQaUserOnPage(signInTimeoutPage.page, config, "A", "B", {
      qaUserIds,
      deps: {
        clerk: {
          ...createMockClerk(signInTimeoutPage).clerk,
          signIn: async () => {
            throw new Error("Clerk sign-in timed out while switching to User B.");
          },
        },
      },
      stepRunner: directStepRunner,
      verifySavedUi: false,
    }),
    "sign-in timed out while switching to User B",
  );

  const mismatchPage = createSwitchPage("user_a");
  await assertRejects(
    switchQaUserOnPage(mismatchPage.page, config, "A", "B", {
      qaUserIds,
      deps: {
        clerk: {
          ...createMockClerk(mismatchPage).clerk,
          signIn: async () => {
            mismatchPage.setActiveUserId("user_wrong");
          },
        },
      },
      stepRunner: directStepRunner,
      verifySavedUi: false,
    }),
    "did not match User B after switching",
  );
}

async function runAuthStepRegression() {
  let executions = 0;
  await assertRejects(
    runAuthStep(
      "failing step",
      async () => {
        executions += 1;
        throw new Error("step failed once");
      },
      directStepRunner,
    ),
    "step failed once",
  );
  assert(executions === 1, "runAuthStep must execute a failing body only once");
}

async function runHeldRequestRegression() {
  const events = [];
  const page = {
    route: async (_pattern, handler) => {
      page._handler = handler;
    },
    unroute: async () => {
      events.push("unroute");
    },
    on: (event, listener) => {
      page._listeners = page._listeners ?? {};
      page._listeners[event] = listener;
    },
    off: () => undefined,
    _handler: null,
    _listeners: {},
  };

  const interceptor = await interceptHeldNext(page, () => true);
  const held = interceptor.waitUntilHeld();

  void page._handler(
    {
      continue: async () => {
        events.push("continued");
      },
      abort: async () => {
        events.push("aborted");
      },
    },
    {
      url: () => "https://example.invalid/list",
      method: () => "GET",
    },
  );

  await held;
  events.push("held");

  page._listeners.framenavigated?.();
  const canceledOutcome = await interceptor.finalize();
  assert(
    canceledOutcome === "canceled-by-navigation",
    "request canceled by sign-out navigation must be handled explicitly",
  );

  const pendingInterceptor = await interceptHeldNext(page, () => true);
  void page._handler(
    {
      continue: async () => undefined,
      abort: async () => undefined,
    },
    {
      url: () => "https://example.invalid/list",
      method: () => "GET",
    },
  );
  await pendingInterceptor.waitUntilHeld();
  const fulfilledOutcome = await pendingInterceptor.finalize();
  assert(
    fulfilledOutcome === "fulfilled",
    "held User A request can be released when still pending",
  );
}

async function runPendingCleanupRegression() {
  let executions = 0;
  await assertRejects(
    runAuthStep(
      "primary failure",
      async () => {
        executions += 1;
        throw new Error("primary switch failure");
      },
      directStepRunner,
    ),
    "primary switch failure",
  );
  await runAuthStep(
    "cleanup swallow",
    async () => {
      throw new Error("secondary cleanup noise");
    },
    directStepRunner,
  ).catch(() => undefined);
  assert(executions === 1, "pending cleanup must not mask the primary failure");
}

try {
  await runSwitchRegression();
  await runAuthStepRegression();
  await runHeldRequestRegression();
  await runPendingCleanupRegression();
  console.log("Version 23 user-switch regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
