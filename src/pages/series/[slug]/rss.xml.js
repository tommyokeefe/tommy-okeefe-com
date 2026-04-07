import rss from "@astrojs/rss";
import { SITE } from "@consts";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const allSeries = await getCollection("series");

  return allSeries.map((series) => ({
    params: { slug: series.slug },
    props: { series },
  }));
}

export async function GET(context) {
  const slug = context.params.slug;
  const seriesEntry = context.props?.series;

  if (!slug || !seriesEntry) {
    throw new Error(`Series '${slug}' not found`);
  }

  const posts = (await getCollection("blog"))
    .filter((post) => post.data.series?.slug === slug && !post.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf(),
    );

  return rss({
    title: `${seriesEntry.data.title} | ${SITE.TITLE}`,
    description: seriesEntry.data.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${post.collection}/${post.slug}/`,
    })),
  });
}
