describe("Blog Post — lm-001 (Tags & TOC)", () => {
  const postUrl = "/blog/lm-001-les-miserables-part-1-book-1-chapter-1";

  beforeEach(() => {
    cy.visit(postUrl);
  });

  it("displays the post title", () => {
    cy.get("h1").should("contain.text", "Monseigneur Myriel");
  });

  it("displays the post date", () => {
    // The date component renders the formatted date
    cy.get("time").should("exist");
  });

  describe("Tags", () => {
    it("displays tag links", () => {
      cy.contains("a", "dao").should("exist");
      cy.contains("a", "mewithoutyou").should("exist");
    });

    it("navigates to the tag page when a tag is clicked", () => {
      cy.contains("a", "dao").click();
      cy.url().should("include", "/tags/");
      cy.get("h1").should("contain.text", "dao");
    });
  });

  describe("Table of Contents", () => {
    it("has a Table of Contents section", () => {
      cy.get("details")
        .contains("summary", "Table of Contents")
        .should("exist");
    });

    it("is open by default", () => {
      cy.get("details")
        .filter(":has(summary:contains('Table of Contents'))")
        .should("have.attr", "open");
    });

    it("contains the expected heading links", () => {
      cy.get("details")
        .filter(":has(summary:contains('Table of Contents'))")
        .within(() => {
          cy.contains("a", "Structure of the Novel").should("exist");
          cy.contains("a", "Who Is This Upright Man?").should("exist");
          cy.contains("a", "Small Town Echoes of the Dao and Proverbs").should(
            "exist",
          );
        });
    });

    it("TOC links point to anchors on the page", () => {
      cy.get("details")
        .filter(":has(summary:contains('Table of Contents'))")
        .find("a[href^='#']")
        .should("have.length", 3);
    });

    it("clicking a TOC link scrolls to the heading", () => {
      cy.get("details")
        .filter(":has(summary:contains('Table of Contents'))")
        .contains("a", "Structure of the Novel")
        .click();
      cy.get("h2").contains("Structure of the Novel").should("be.visible");
    });
  });

  describe("Post Navigation", () => {
    it("has a next post navigation link", () => {
      // lm-001 is not the last post, so it must have a next link
      cy.get("a[data-post-nav='next']").should("exist");
    });

    it("next post link navigates to a blog post", () => {
      cy.get("a[data-post-nav='next']").click();
      cy.url().should("include", "/blog/");
      cy.get("h1").should("exist");
    });
  });

  describe("Series Link", () => {
    it("shows a link to the Les Miserables series", () => {
      cy.contains("a", "Les Mis").should("exist");
    });
  });
});
