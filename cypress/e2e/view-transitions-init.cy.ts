/**
 * Tests that init() re-runs after client-side navigation via View Transitions.
 *
 * The bug (Finding 1): Head.astro uses DOMContentLoaded (fires once per session)
 * instead of astro:page-load (fires on initial load AND after every navigation).
 * This means .animate elements never get .show, theme buttons lose active state,
 * and other init() behaviors break after a client-side navigation.
 *
 * Strategy: visit page A → click a nav link to page B → assert init() behaviors
 * are present on page B (proving init() ran post-navigation, not just on hard load).
 */
describe("View Transitions — init() re-executes after navigation", () => {
  /**
   * After a client-side navigation, .animate elements should receive the .show class.
   * If init() doesn't re-run, animate() is never called and .show is never added.
   */
  it("adds .show to .animate elements after navigating from homepage to blog list", () => {
    cy.visit("/");

    // Navigate to /blog via the header link (client-side nav, no full reload)
    cy.get("header").contains("a", "blog").click();
    cy.url().should("include", "/blog");

    // All .animate elements should have .show added by init() → animate()
    cy.get(".animate").each(($el) => {
      cy.wrap($el).should("have.class", "show");
    });
  });

  /**
   * After a client-side navigation, the active theme button should still
   * have its active styling class. updateThemeButtons() is called inside init().
   * If init() doesn't re-run, the buttons will have no active state.
   */
  it("keeps the active theme button styled after navigating from homepage to blog list", () => {
    cy.visit("/");

    // Navigate client-side
    cy.get("header").contains("a", "blog").click();
    cy.url().should("include", "/blog");

    // Exactly one of the three theme buttons should have the active class
    const activeClass = "bg-black\\/5";
    cy.get("#light-theme-button, #dark-theme-button, #system-theme-button")
      .filter(`.${activeClass}`)
      .should("have.length", 1);
  });

  /**
   * Navigating from /blog back to / should also re-run init().
   * This catches issues where init() only ran once during the session.
   */
  it("adds .show to .animate elements after navigating from blog list back to homepage", () => {
    cy.visit("/blog");

    // Navigate back to homepage
    cy.get("header").find("a[href='/']").first().click();
    cy.url().should("eq", Cypress.config("baseUrl") + "/");

    cy.get(".animate").each(($el) => {
      cy.wrap($el).should("have.class", "show");
    });
  });

  /**
   * Navigate to a blog post (which has .animate elements) via a client-side link.
   * This proves init() works across different page types, not just top-level routes.
   */
  it("adds .show to .animate elements after navigating to a blog post", () => {
    cy.visit("/blog");

    // Click the first blog post card link
    cy.get("main a[href^='/blog/']").first().click();
    cy.url().should("include", "/blog/");

    cy.get(".animate").each(($el) => {
      cy.wrap($el).should("have.class", "show");
    });
  });
});
