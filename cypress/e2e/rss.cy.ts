describe("RSS Feeds", () => {
  it("serves the global RSS feed with blog post links", () => {
    cy.request("/rss.xml").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("xml");
      expect(response.body).to.include("<rss");
      expect(response.body).to.include("<item>");
      expect(response.body).to.match(
        /<link>https?:\/\/[^<]+\/blog\/[^<]+<\/link>/,
      );
    });
  });

  it("serves a series RSS feed with only series-specific posts", () => {
    cy.request("/series/les-miserables/rss.xml").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("xml");
      expect(response.body).to.include("<rss");
      expect(response.body).to.include("<item>");
      expect(response.body).to.include("les-miserables");
      expect(response.body).to.not.include("/blog/hpw-");
    });
  });
});
