describe("Les Miserables Series Page", () => {
    beforeEach(() => {
        cy.visit("/series/les-miserables");
    });

    it("has the correct page heading", () => {
        cy.get("h1").should("contain.text", "Les Mis");
    });

    it("displays part headings", () => {
        cy.get("h2").contains("Fantine").should("exist");
    });

    it("displays book headings under parts", () => {
        cy.get("h3").should("have.length.at.least", 1);
    });

    it("has chapter links pointing to blog posts", () => {
        cy.get("a[href^='/blog/lm-']").should("have.length.at.least", 1);
    });

    it("chapter links include post titles", () => {
        cy.get("a[href^='/blog/lm-']").first().then(($link) => {
            // Chapter links should contain meaningful text (chapter name + post title)
            const text = $link.text();
            expect(text.length).to.be.greaterThan(5);
        });
    });

    it("clicking a chapter link navigates to the blog post", () => {
        cy.get("a[href^='/blog/lm-']").first().click();
        cy.url().should("include", "/blog/lm-");
        cy.get("h1").should("exist");
    });

    it("has an intro post card", () => {
        // The first entry in the series is rendered as an ArrowCard
        cy.contains("a", "Les Mis").should("exist");
    });

    it("has the hierarchical part > book > chapter structure", () => {
        // Verify the nesting: h2 (part) should precede h3 (book) in the DOM
        cy.get("h2")
            .first()
            .then(($h2) => {
                // Find the next h3 after this h2
                cy.wrap($h2).parent().find("h3").should("have.length.at.least", 1);
            });
    });
});
