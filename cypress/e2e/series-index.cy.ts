describe("Series Index Page (/series)", () => {
  beforeEach(() => {
    cy.visit("/series");
  });

  it("has the correct page heading", () => {
    cy.get("h1").should("contain.text", "Active Series");
  });

  it("has the correct page title in the document", () => {
    cy.title().should("contain", "Tommy O'Keefe");
  });

  it("displays at least one series card", () => {
    cy.get("ul.not-prose li").should("have.length.at.least", 1);
  });

  it("series cards link to individual series pages", () => {
    cy.get("ul.not-prose li a[href^='/series/']").should(
      "have.length.at.least",
      1,
    );
  });

  it("navigates to a series page when a card is clicked", () => {
    cy.get("ul.not-prose li a[href^='/series/']").first().click();
    cy.url().should("include", "/series/");
    cy.get("h1").should("exist");
  });

  it("has the Les Miserables series card", () => {
    cy.get("a[href='/series/les-miserables']").should("exist");
  });

  it("has a header with navigation links", () => {
    cy.get("header").within(() => {
      cy.get("a[href='/blog']").should("contain.text", "blog");
    });
  });
});
