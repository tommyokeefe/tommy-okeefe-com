// Prevent Cypress from failing tests on uncaught exceptions
// from third-party scripts (Vercel Analytics, Giscus, etc.)
Cypress.on("uncaught:exception", (_err, _runnable) => {
  return false;
});
