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
        if (post.data.draft) return;
        const tags = post.data.tags ?? [];
        tags.forEach((t) => tagsSet.add(t));
    });

    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
}

// Given a raw tag name, return all posts that include it, sorted by date desc.
export async function getPostsForTag(tag: string) {
    const posts = (await getCollection("blog")).filter(
        (post) =>
            !post.data.draft &&
            (post.data.tags ?? []).some((t) => t === tag),
    );
    return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// When given a slug from the URL, try to find the original tag name.
export async function findTagBySlug(slug: string): Promise<string | undefined> {
    const tags = await getAllTags();
    return tags.find((t) => slugifyTag(t) === slug);
}
