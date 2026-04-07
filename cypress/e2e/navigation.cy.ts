describe("Navigation", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  context("Desktop nav", () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it("shows blog, series, tags, and rss links", () => {
      cy.get("nav[aria-label='Main navigation']").should("be.visible");
      cy.get("header").find("a[href='/blog']").should("exist");
      cy.get("header").find("a[href='/tags']").should("exist");
      cy.get("header").find("a[href='/rss.xml']").should("exist");
      cy.get("#series-dropdown-btn")
        .should("be.visible")
        .and("contain.text", "series");
    });

    it("hamburger button is not visible on desktop", () => {
      cy.get("#hamburger-btn").should("not.be.visible");
    });

    it("series dropdown is hidden by default", () => {
      cy.get("#series-dropdown-menu").should("not.be.visible");
    });

    it("series dropdown opens on click and shows All Series link", () => {
      cy.get("#series-dropdown-btn").click();
      cy.get("#series-dropdown-menu").should("be.visible");
      cy.get("#series-dropdown-menu")
        .contains("a", "All Series")
        .should("have.attr", "href", "/series");
    });

    it("series dropdown lists individual series", () => {
      cy.get("#series-dropdown-btn").click();
      cy.get("#series-dropdown-menu a").should("have.length.at.least", 2);
    });

    it("series dropdown closes when clicking outside", () => {
      cy.get("#series-dropdown-btn").click();
      cy.get("#series-dropdown-menu").should("be.visible");
      cy.get("body").click(0, 0);
      cy.get("#series-dropdown-menu").should("not.be.visible");
    });

    it("series dropdown closes on Escape key", () => {
      cy.get("#series-dropdown-btn").click();
      cy.get("#series-dropdown-menu").should("be.visible");
      cy.get("body").type("{esc}");
      cy.get("#series-dropdown-menu").should("not.be.visible");
    });

    it("search button is always visible on desktop", () => {
      cy.get("#magnifying-glass").should("be.visible");
    });
  });

  context("Mobile nav", () => {
    beforeEach(() => {
      cy.viewport(375, 812);
    });

    it("desktop nav is hidden on mobile", () => {
      cy.get("nav[aria-label='Main navigation']").should("not.be.visible");
    });

    it("hamburger button is visible on mobile", () => {
      cy.get("#hamburger-btn").should("be.visible");
    });

    it("mobile menu is hidden by default", () => {
      cy.get("#mobile-menu").should("not.be.visible");
    });

    it("mobile menu opens when hamburger is clicked", () => {
      cy.get("#hamburger-btn").click();
      cy.get("#mobile-menu").should("be.visible");
    });

    it("mobile menu closes when hamburger is clicked again", () => {
      cy.get("#hamburger-btn").click();
      cy.get("#mobile-menu").should("be.visible");
      cy.get("#hamburger-btn").click();
      cy.get("#mobile-menu").should("not.be.visible");
    });

    it("mobile menu contains blog, tags, and rss links", () => {
      cy.get("#hamburger-btn").click();
      cy.get("#mobile-menu").within(() => {
        cy.get("a[href='/blog']").should("contain.text", "blog");
        cy.get("a[href='/tags']").should("contain.text", "tags");
        cy.get("a[href='/rss.xml']").should("contain.text", "rss");
      });
    });

    it("mobile series section expands to show series links", () => {
      cy.get("#hamburger-btn").click();
      cy.get("#mobile-series-list").should("not.be.visible");
      cy.get("#mobile-series-btn").click();
      cy.get("#mobile-series-list").should("be.visible");
      cy.get("#mobile-series-list")
        .contains("a", "All Series")
        .should("have.attr", "href", "/series");
    });

    it("search button is always visible on mobile", () => {
      cy.get("#magnifying-glass").should("be.visible");
    });

    it("mobile menu closes on Escape key", () => {
      cy.get("#hamburger-btn").click();
      cy.get("#mobile-menu").should("be.visible");
      cy.get("body").type("{esc}");
      cy.get("#mobile-menu").should("not.be.visible");
    });
  });
});
