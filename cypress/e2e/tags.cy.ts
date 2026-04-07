describe("Tags", () => {
  describe("Tag Cloud (/tags)", () => {
    beforeEach(() => {
      cy.visit("/tags");
    });

    it("has the correct page heading", () => {
      cy.get("h1").should("contain.text", "Tags");
    });

    it("displays tag links", () => {
      cy.get("a[href^='/tags/']").should("have.length.at.least", 1);
    });

    it("tag links have title attributes showing post counts", () => {
      cy.get("a[href^='/tags/']")
        .first()
        .should("have.attr", "title")
        .and("match", /\d+ posts?/);
    });

    it("tag links use font-size scaling (sizes vary by post count)", () => {
      // The tag cloud scales font sizes by post count — with multiple tags
      // at different counts there should be at least 2 distinct sizes
      cy.get("a[href^='/tags/']").then(($links) => {
        const sizes = [...$links].map((el) => el.style.fontSize);
        const unique = new Set(sizes);
        expect(unique.size).to.be.at.least(2);
      });
    });

    it("navigates to the tag detail page when a tag is clicked", () => {
      cy.get("a[href^='/tags/']").first().click();
      cy.url().should("include", "/tags/");
      cy.get("h1").should("exist");
    });
  });

  describe("Tag Detail Page (/tags/[tag])", () => {
    // Use a known tag from lm-001
    const tag = "dao";

    beforeEach(() => {
      cy.visit(`/tags/${tag}`);
    });

    it("has the correct page heading", () => {
      cy.get("h1").should("contain.text", `#${tag}`);
    });

    it("displays post cards for the tag", () => {
      cy.get("a[href^='/blog/']").should("have.length.at.least", 1);
    });

    it("all post links point to blog posts", () => {
      cy.get("a[href^='/blog/']").each(($link) => {
        expect($link.attr("href")).to.match(/^\/blog\/.+/);
      });
    });

    it("navigates to a blog post when a card is clicked", () => {
      cy.get("a[href^='/blog/']").first().click();
      cy.url().should("include", "/blog/");
      cy.get("h1").should("exist");
    });

    it("has the correct page title in the document", () => {
      cy.title().should("contain", tag);
    });
  });
});
