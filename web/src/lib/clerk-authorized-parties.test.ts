import assert from "node:assert/strict";

import {
  CLERK_LOCAL_AUTHORIZED_PARTIES,
  CLERK_PRODUCTION_AUTHORIZED_PARTIES,
  getClerkAuthorizedParties,
} from "./clerk-authorized-parties";

const productionOrigins = [
  "https://jobfit.cooperrobillard.com",
  "https://internship-fit-gap-analyzer.vercel.app",
];

const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

assert.deepEqual(
  getClerkAuthorizedParties("development"),
  localOrigins,
  "development should authorize only approved local origins",
);

assert.deepEqual(
  getClerkAuthorizedParties("production"),
  productionOrigins,
  "production should authorize only approved production origins",
);

assert.deepEqual(
  getClerkAuthorizedParties(undefined),
  productionOrigins,
  "undefined NODE_ENV should fail closed to production origins",
);

assert.deepEqual(
  getClerkAuthorizedParties("staging"),
  productionOrigins,
  "nonstandard NODE_ENV should fail closed to production origins",
);

const returnedProductionOrigins = getClerkAuthorizedParties("production");
returnedProductionOrigins.push("https://malicious.example");
assert.deepEqual(
  CLERK_PRODUCTION_AUTHORIZED_PARTIES,
  productionOrigins,
  "mutating a returned production array should not mutate exported constants",
);
assert.notDeepEqual(
  returnedProductionOrigins,
  CLERK_PRODUCTION_AUTHORIZED_PARTIES,
  "helper should return a fresh production array",
);

const returnedLocalOrigins = getClerkAuthorizedParties("development");
returnedLocalOrigins.push("http://malicious.localhost:3000");
assert.deepEqual(
  CLERK_LOCAL_AUTHORIZED_PARTIES,
  localOrigins,
  "mutating a returned local array should not mutate exported constants",
);
assert.notDeepEqual(
  returnedLocalOrigins,
  CLERK_LOCAL_AUTHORIZED_PARTIES,
  "helper should return a fresh local array",
);

const allOrigins = [
  ...CLERK_PRODUCTION_AUTHORIZED_PARTIES,
  ...CLERK_LOCAL_AUTHORIZED_PARTIES,
];

assert.equal(
  allOrigins.some((origin) => origin.includes("*")),
  false,
  "authorized parties should not include wildcards",
);

assert.equal(
  CLERK_PRODUCTION_AUTHORIZED_PARTIES.some((origin) => origin.startsWith("http://")),
  false,
  "production authorized parties should not include HTTP origins",
);
