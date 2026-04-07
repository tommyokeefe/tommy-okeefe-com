describe("404 Page", () => {
  beforeEach(() => {
    // Visit a route that doesn't exist to trigger the 404 page
    cy.visit("/this-page-does-not-exist", { failOnStatusCode: false });
  });

  it("shows the 404 heading", () => {
    cy.get("h4").should("contain.text", "404: Page not found");
  });

  it("has a link back to the home page", () => {
    cy.contains("a", "Go to home page").should("exist");
  });

  it("navigates home when the link is clicked", () => {
    cy.contains("a", "Go to home page").click();
    cy.url().should("eq", Cypress.config("baseUrl") + "/");
    cy.get("h1").should("contain.text", "Tommy");
  });

  it("still has the site header", () => {
    cy.get("header").should("exist");
    cy.get("header a[href='/blog']").should("exist");
  });

  it("still has the site footer with theme buttons", () => {
    cy.get("footer").within(() => {
      cy.get("#light-theme-button").should("exist");
      cy.get("#dark-theme-button").should("exist");
      cy.get("#system-theme-button").should("exist");
    });
  });
});
