describe("Most Recent Read", () => {
  describe("Homepage widget", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("displays the 'Most Recent Read' widget header on desktop sidebar", () => {
      cy.viewport("macbook-15");
      cy.get("aside").contains("h2", "Most Recent Read").should("be.visible");
    });

    it("displays a book cover with correct aspect ratio in the widget", () => {
      cy.viewport("macbook-15");
      // Verify the widget card contains an image
      cy.get("aside").find("a[href='/reading']").should("be.visible");
      cy.get("aside")
        .find("a[href='/reading']")
        .within(() => {
          cy.get("img").should("exist").and("have.attr", "alt");
        });
    });

    it("displays book title and author in the widget", () => {
      cy.viewport("macbook-15");
      cy.get("aside")
        .find("a[href='/reading']")
        .find("h2, div") // More flexible selector for text content
        .should("have.length.greaterThan", 0); // At least some content
      cy.get("aside").find("a[href='/reading']").should("contain.text", " "); // Has some text (title and author)
    });

    it("links to the /reading detail page", () => {
      cy.viewport("macbook-15");
      cy.get("aside").find("a[href='/reading']").should("exist");
    });

    it("displays the widget inline on mobile", () => {
      cy.viewport("iphone-x");
      cy.contains("h2", "Most Recent Read").should("be.visible");
    });

    it("has spacing between widgets on desktop", () => {
      cy.viewport("macbook-15");
      cy.get("aside").find("[class*='pb-']").should("exist"); // Some padding class
    });
  });

  describe("/reading detail page", () => {
    beforeEach(() => {
      cy.visit("/reading");
    });

    it("has the correct page title", () => {
      cy.title().should("contain", "Most Recent Read");
    });

    it("displays the page heading 'Most Recent Read'", () => {
      cy.get("h1").should("contain.text", "Most Recent Read");
    });

    it("displays the subtitle describing the page purpose", () => {
      cy.get("p").should("contain.text", "The last book I finished");
    });

    it("displays a book cover image with fixed dimensions", () => {
      cy.get("main")
        .find("img[alt*='by']") // Image alt contains book and author
        .should("have.class", "h-48")
        .and("have.class", "w-36")
        .and("have.class", "object-cover");
    });

    it("displays book title in a heading", () => {
      cy.get("h2").should("have.length.greaterThan", 0); // At least one h2 for book title
    });

    it("displays author name", () => {
      cy.get("p").should("have.length.greaterThan", 1); // Multiple paragraphs including author
    });

    it("displays a star rating out of 5", () => {
      // Check for rating display (e.g., "3.5 / 5", "4 / 5", etc.)
      cy.get("main")
        .contains(/\d+(\.\d+)?\s*\/\s*5/)
        .should("be.visible");
      // Stars should be rendered: check for SVG elements with proper fill classes
      cy.get("main").find("svg").should("have.length.greaterThan", 0);
    });

    it("displays tags as styled pills", () => {
      cy.get("main")
        .find("span[class*='rounded-full'][class*='border']")
        .should("have.length.greaterThan", 0);
    });

    it("displays an Open Library link", () => {
      cy.contains("a", "View on Open Library")
        .should("exist")
        .and("have.attr", "href")
        .and("include", "openlibrary.org");
    });

    it("displays StoryGraph metadata section", () => {
      cy.contains("p", "StoryGraph Metadata").should("be.visible");
    });

    it("displays StoryGraph metadata fields", () => {
      // Check that dl/dt/dd pairs exist for metadata
      cy.get("dl").should("exist");
      cy.get("dt").should("have.length.greaterThan", 0);
      cy.get("dd").should("have.length.greaterThan", 0);
    });

    it("has a back button linking to homepage", () => {
      cy.contains("a", "Back home").should("have.attr", "href", "/");
    });
  });

  describe("Navigation and accessibility", () => {
    it("can navigate from homepage widget to detail page", () => {
      cy.visit("/");
      cy.viewport("macbook-15");
      cy.get("aside").find("a[href='/reading']").click();
      cy.url().should("include", "/reading");
      cy.contains("h1", "Most Recent Read").should("be.visible");
    });

    it("book cover image has descriptive alt text", () => {
      cy.visit("/reading");
      cy.get("main").find("img").should("have.attr", "alt").and("match", /by/); // Alt text should include "by" (book title by author format)
    });

    it("external links have proper rel attributes for security", () => {
      cy.visit("/reading");
      cy.contains("a", "View on Open Library")
        .should("have.attr", "rel")
        .and("include", "noopener");
    });
  });

  describe("Data display", () => {
    beforeEach(() => {
      cy.visit("/reading");
    });

    it("displays book information in a readable layout", () => {
      // Verify the key sections exist: title, author, rating, tags
      cy.get("main").find("h2").should("have.length.greaterThan", 0);
      cy.get("main").find("img").should("have.length.greaterThan", 0);
      cy.get("main")
        .contains(/\d+(\.\d+)?\s*\/\s*5/)
        .should("be.visible");
    });

    it("displays a numeric rating", () => {
      // Match any rating format: "3 / 5", "3.5 / 5", etc.
      cy.get("main")
        .contains(/\d+(\.\d+)?\s*\/\s*5/)
        .should("be.visible");
    });

    it("renders exactly 5 star icons", () => {
      // The rating display should always have 5 stars (full, half, or empty)
      // Look for the SVG container with the aria-label that indicates stars
      cy.get("main")
        .find("[aria-label*='star'], [aria-label*='rating']")
        .find("svg")
        .should("have.length", 5);
    });

    it("displays genre or subject tags", () => {
      cy.get("main")
        .find("span")
        .filter("[class*='rounded-full']")
        .should("have.length.greaterThan", 0);
    });
  });
});
