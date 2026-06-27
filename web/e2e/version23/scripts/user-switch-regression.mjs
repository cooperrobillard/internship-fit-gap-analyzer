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
  const navigations = [];
  return {
    page: {
      url: () => "https://example.invalid/dashboard/saved",
      goto: async (target) => {
        navigations.push(target);
        return { status: () => 200 };
      },
      waitForFunction: async () => {
        if (activeUserId) {
          throw new Error("still signed in");
        }
      },
      evaluate: async () => activeUserId,
    },
    navigations,
    setActiveUserId: (value) => {
      activeUserId = value;
    },
    getActiveUserId: () => activeUserId,
  };
}

function createMockClerk(pageState) {
  const calls = [];
  return {
    calls,
    clerk: {
      signOut: async () => {
        calls.push("signOut");
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
    !pageState.navigations.some((target) => new URL(target).pathname === "/"),
    "switch must not navigate to the landing page",
  );
  assert(
    pageState.page.url() === "https://example.invalid/dashboard/saved",
    "switch must retain the same page URL",
  );

  const signedOutPage = createSwitchPage(null);
  await assertRejects(
    switchQaUserOnPage(signedOutPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: createMockClerk(signedOutPage).clerk },
      stepRunner: directStepRunner,
    }),
    "attempted while signed out",
  );

  const timeoutPage = createSwitchPage("user_a");
  const hangingSignOut = {
    signOut: async () => {
      throw new Error("Clerk sign-out timed out while switching from User A.");
    },
    signIn: async () => undefined,
    loaded: async () => undefined,
  };
  await assertRejects(
    switchQaUserOnPage(timeoutPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: hangingSignOut },
      stepRunner: directStepRunner,
    }),
    "sign-out timed out while switching from User A",
  );

  const signInTimeoutPage = createSwitchPage("user_a");
  const hangingSignIn = {
    signOut: async () => {
      signInTimeoutPage.setActiveUserId(null);
    },
    signIn: async () => {
      throw new Error("Clerk sign-in timed out while switching to User B.");
    },
    loaded: async () => undefined,
  };
  await assertRejects(
    switchQaUserOnPage(signInTimeoutPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: hangingSignIn },
      stepRunner: directStepRunner,
    }),
    "sign-in timed out while switching to User B",
  );

  const mismatchPage = createSwitchPage("user_a");
  const mismatchClerk = {
    signOut: async () => {
      mismatchPage.setActiveUserId(null);
    },
    signIn: async () => {
      mismatchPage.setActiveUserId("user_wrong");
    },
    loaded: async () => undefined,
  };
  await assertRejects(
    switchQaUserOnPage(mismatchPage.page, config, "A", "B", {
      qaUserIds,
      deps: { clerk: mismatchClerk },
      stepRunner: directStepRunner,
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
    _handler: null,
  };

  const interceptor = await interceptHeldNext(page, () => true);
  const held = interceptor.waitUntilHeld();
  const settled = interceptor.waitUntilSettled();

  void page._handler(
    {
      continue: async () => {
        events.push("continued");
      },
    },
    {
      url: () => "https://example.invalid/list",
      method: () => "GET",
    },
  );

  await held;
  events.push("held");

  const pageState = createSwitchPage("user_a");
  const mock = createMockClerk(pageState);
  await switchQaUserOnPage(pageState.page, config, "A", "B", {
    qaUserIds,
    deps: { clerk: mock.clerk },
    stepRunner: directStepRunner,
  });
  events.push("user-b-active");

  interceptor.release();
  await settled;
  await interceptor.unroute();

  assert(
    events.indexOf("held") < events.indexOf("user-b-active"),
    "held request must remain blocked until User B is active",
  );
  assert(
    events.indexOf("user-b-active") < events.indexOf("continued"),
    "stale User A response must be released only after User B becomes active",
  );
}

async function runPendingCleanupRegression() {
  let executions = 0;
  const primary = runAuthStep(
    "primary failure",
    async () => {
      executions += 1;
      throw new Error("primary switch failure");
    },
    directStepRunner,
  );

  await assertRejects(primary, "primary switch failure");
  await runAuthStep(
    "cleanup swallow",
    async () => {
      throw new Error("secondary cleanup noise");
    },
    directStepRunner,
  ).catch(() => undefined);
  assert(executions === 1, "pending cleanup must not rerun the primary failing body");
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
