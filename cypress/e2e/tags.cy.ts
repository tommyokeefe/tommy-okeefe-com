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

    describe("Back to Home Navigation", () => {
      it("has a 'Back to Home' link", () => {
        cy.get("a[data-back-to-previous][href='/']").should("exist");
      });

      it("displays 'Back to Home' text in the link", () => {
        cy.get("a[data-back-to-previous][href='/']").should(
          "contain.text",
          "Back to Home",
        );
      });

      it("navigates to home when 'Back to Home' link is clicked", () => {
        cy.get("a[data-back-to-previous][href='/']").click();
        cy.url().should("eq", Cypress.config("baseUrl") + "/");
        cy.get("h1").should("contain.text", "Hi, I'm Tommy!");
      });

      it("preserves page state during view transition from tags to home", () => {
        // Navigate to /tags
        cy.visit("/tags");

        // Click the back to home link (client-side navigation)
        cy.get("a[data-back-to-previous][href='/']").click();
        cy.url().should("eq", Cypress.config("baseUrl") + "/");

        // Verify animate elements have .show class (proving init() re-ran post-navigation)
        cy.get(".animate").each(($el) => {
          cy.wrap($el).should("have.class", "show");
        });
      });
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

    describe("Back to Tags Navigation", () => {
      it("has a 'Back to Tags' link", () => {
        cy.get("a[data-back-to-previous][href='/tags']").should("exist");
      });

      it("displays 'Back to Tags' text in the link", () => {
        cy.get("a[data-back-to-previous][href='/tags']").should(
          "contain.text",
          "Back to Tags",
        );
      });

      it("navigates to tags when 'Back to Tags' link is clicked", () => {
        cy.get("a[data-back-to-previous][href='/tags']").click();
        cy.url().should("include", "/tags");
        cy.url().should("not.include", `/tags/${tag}`);
        cy.get("h1").should("contain.text", "Tags");
      });

      it("preserves page state during view transition from tag detail to tags", () => {
        // Start on tag detail page
        cy.visit(`/tags/${tag}`);

        // Click the back to tags link (client-side navigation)
        cy.get("a[data-back-to-previous][href='/tags']").click();
        cy.url().should("include", "/tags");
        cy.url().should("not.include", `/${tag}`);

        // Verify animate elements have .show class (proving init() re-ran post-navigation)
        cy.get(".animate").each(($el) => {
          cy.wrap($el).should("have.class", "show");
        });
      });
    });
  });

  describe("Back-to-Navigation Round-trip", () => {
    it("allows round-trip navigation: tags → tag detail → tags", () => {
      const tag = "dao";

      // Start at tags index
      cy.visit("/tags");
      cy.get("h1").should("contain.text", "Tags");

      // Navigate to tag detail
      cy.get("a[href^='/tags/']").first().click();
      cy.url().should("include", "/tags/");

      // Navigate back to tags
      cy.get("a[data-back-to-previous][href='/tags']").click();
      cy.url().should("include", "/tags");
      cy.get("h1").should("contain.text", "Tags");
    });

    it("allows round-trip navigation: tags → tag detail → home", () => {
      // Start at tags index
      cy.visit("/tags");
      cy.get("h1").should("contain.text", "Tags");

      // Navigate to tag detail
      cy.get("a[href^='/tags/']").first().click();
      cy.url().should("include", "/tags/");

      // Navigate back to home via tags
      cy.visit("/tags");
      cy.get("a[data-back-to-previous][href='/']").click();
      cy.url().should("eq", Cypress.config("baseUrl") + "/");
      cy.get("h1").should("contain.text", "Hi, I'm Tommy!");
    });
  });
});
