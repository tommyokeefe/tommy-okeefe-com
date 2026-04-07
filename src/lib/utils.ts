import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

// create a URL-friendly slug from arbitrary text (lowercase, alphanumeric & hyphens)
export function slugify(text: string) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^a-z0-9\-]/g, "") // remove non-alphanumeric
    .replace(/\-+/g, "-"); // collapse multiple hyphens
}
