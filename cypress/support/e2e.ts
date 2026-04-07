// Suppress uncaught exceptions from known third-party scripts only.
// First-party errors (from our own source files) will still fail tests.
const THIRD_PARTY_ERROR_PATTERNS = [
  /vitals\.vercel-insights\.com/,
  /va\.vercel-scripts\.com/,
  /vercel-insights\.com/,
  /vercel-scripts\.com/,
  /bluesky/i,
  /bsky\.app/,
];

Cypress.on("uncaught:exception", (err: Error) => {
  const isThirdParty = THIRD_PARTY_ERROR_PATTERNS.some((pattern) =>
    pattern.test(err.message + (err.stack ?? "")),
  );
  // Returning false suppresses the error; returning void lets Cypress fail the test
  if (isThirdParty) return false;
});
