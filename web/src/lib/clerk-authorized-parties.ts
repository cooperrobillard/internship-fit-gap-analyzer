export const CLERK_PRODUCTION_AUTHORIZED_PARTIES = Object.freeze([
  "https://jobfit.cooperrobillard.com",
  "https://internship-fit-gap-analyzer.vercel.app",
] as const);

export const CLERK_LOCAL_AUTHORIZED_PARTIES = Object.freeze([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const);

export function getClerkAuthorizedParties(nodeEnv?: string): string[] {
  if (nodeEnv === "development") {
    return [...CLERK_LOCAL_AUTHORIZED_PARTIES];
  }

  return [...CLERK_PRODUCTION_AUTHORIZED_PARTIES];
}
