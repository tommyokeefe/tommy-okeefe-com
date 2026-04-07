describe("Homepage", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("has the correct page title", () => {
    cy.title().should("contain", "Tommy O'Keefe");
  });

  it("displays the greeting heading", () => {
    cy.get("h1").should("contain.text", "Tommy");
  });

  it("has a header with navigation links", () => {
    cy.get("header").within(() => {
      cy.get("a[href='/']").should("exist");
      cy.get("a[href='/blog']").should("contain.text", "blog");
      cy.get("a[href='/rss.xml']").should("contain.text", "rss");
    });
  });

  it("shows the Active Series section with at least one card", () => {
    cy.contains("h2", "Active Series").should("be.visible");
    cy.contains("h2", "Active Series")
      .closest("section")
      .find("ul > li")
      .should("have.length.at.least", 1);
  });

  it("shows the Latest Posts section with up to 5 cards", () => {
    cy.contains("h2", "Latest posts").should("be.visible");
    cy.contains("h2", "Latest posts")
      .closest("section")
      .find("ul > li")
      .should("have.length.at.least", 1)
      .and("have.length.at.most", 5);
  });

  it("has a 'See all posts' link to /blog", () => {
    cy.contains("a", "See all posts").should("have.attr", "href", "/blog");
  });

  it("has social links for Bluesky and LinkedIn", () => {
    cy.contains("a", "Bluesky").should("exist");
    cy.contains("a", "LinkedIn").should("exist");
  });

  it("has a footer with theme toggle buttons", () => {
    cy.get("footer").within(() => {
      cy.get("#light-theme-button").should("exist");
      cy.get("#dark-theme-button").should("exist");
      cy.get("#system-theme-button").should("exist");
    });
  });

  it("has a search button", () => {
    cy.get("#magnifying-glass").should("exist");
  });
});
