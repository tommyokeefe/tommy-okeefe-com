describe("Blog List Page", () => {
  beforeEach(() => {
    cy.visit("/blog");
  });

  it("has the correct page heading", () => {
    cy.get("h1").should("contain.text", "Blog");
  });

  it("displays posts grouped by year", () => {
    // Year headings are bold dividers — each section.animate starts with a year div
    // The year div is the first direct child div with font-semibold inside each section
    cy.get("main section.animate div.font-semibold")
      .first()
      .invoke("text")
      .invoke("trim")
      .should("match", /^\d{4}$/);
  });

  it("contains post cards linking to blog posts", () => {
    cy.get("a[href^='/blog/']")
      .first()
      .then(($link) => {
        const href = $link.attr("href");
        expect(href).to.match(/^\/blog\/.+/);
      });
  });

  it("navigates to a blog post when a card is clicked", () => {
    cy.get("a[href^='/blog/']").first().click();
    cy.url().should("include", "/blog/");
    cy.get("h1").should("exist");
  });

  it("contains a link to the series page", () => {
    cy.get("a[href='/series']").should("exist");
  });
});
