import { getCollection } from "astro:content";
import { slugify } from "./utils";

// Utility to convert a tag string to a URL slug.
export function slugifyTag(tag: string): string {
  return slugify(tag);
}

// Retrieves all unique tags used in non-draft blog posts, sorted alphabetically.
export async function getAllTags(): Promise<string[]> {
  const posts = await getCollection("blog");
  const tagsSet = new Set<string>();

  posts.forEach((post) => {
    if (import.meta.env.PROD && post.data.draft) return;
    const tags = post.data.tags ?? [];
    tags.forEach((t) => tagsSet.add(t));
  });

  return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
}

// Given a raw tag name, return all posts that include it, sorted by date desc.
export async function getPostsForTag(tag: string) {
  const posts = (await getCollection("blog")).filter(
    (post) =>
      (import.meta.env.PROD ? !post.data.draft : true) &&
      (post.data.tags ?? []).some((t) => t === tag),
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Retrieves all unique tags with their post counts, sorted alphabetically.
export async function getTagsWithCounts(): Promise<
  { tag: string; count: number }[]
> {
  const posts = await getCollection("blog");
  const tagCounts = new Map<string, number>();

  posts.forEach((post) => {
    if (import.meta.env.PROD && post.data.draft) return;
    (post.data.tags ?? []).forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

// When given a slug from the URL, try to find the original tag name.
export async function findTagBySlug(slug: string): Promise<string | undefined> {
  const tags = await getAllTags();
  return tags.find((t) => slugifyTag(t) === slug);
}
