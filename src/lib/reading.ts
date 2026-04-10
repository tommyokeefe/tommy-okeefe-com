import bookData from "../data/current-reading.json";

type PlotOrCharacter = "Plot" | "Character" | "Both";
type YesNoComplicated = "Yes" | "No" | "Complicated";

export type StorygraphMeta = {
  plotOrCharacterDriven: PlotOrCharacter;
  strongCharacterDevelopment: YesNoComplicated;
  loveableCharacters: YesNoComplicated;
  diverseCast: YesNoComplicated;
  flawsAMainFocus: YesNoComplicated;
};

export type CurrentBook = {
  title: string;
  author: string;
  isbn: string | null;
  rating: number;
  tags: string[];
  storygraph?: StorygraphMeta;
  coverUrl: string | null;
  openLibraryUrl: string | null;
};

async function fetchOpenLibraryData(
  title: string,
  author: string,
  isbn: string | null,
): Promise<{ coverUrl: string | null; openLibraryUrl: string | null }> {
  const empty = { coverUrl: null, openLibraryUrl: null };

  try {
    // Search Open Library for the book (always do this for cover_i and page URL)
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1&fields=key,cover_i`,
    );
    if (!res.ok) return empty;
    const data = await res.json();
    const doc = data?.docs?.[0];
    if (!doc) return empty;

    const openLibraryUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;

    // Try ISBN cover first, then fallback to cover_i
    let coverUrl: string | null = null;
    if (isbn) {
      const isbnCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      // Validate that the ISBN cover exists (not a blank GIF)
      const coverCheck = await fetch(isbnCoverUrl, { method: "HEAD" });
      if (coverCheck.ok) {
        // Additional check: Open Library returns 200 for blank GIFs too,
        // so we check content-length (blank GIFs are typically very small)
        const contentLength = parseInt(
          coverCheck.headers.get("content-length") ?? "0",
          10,
        );
        if (contentLength > 1000) {
          // Real covers are larger than 1KB
          coverUrl = isbnCoverUrl;
        }
      }
    }

    // If ISBN didn't work, fallback to cover_i from search
    if (!coverUrl && doc.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }

    return { coverUrl, openLibraryUrl };
  } catch (err) {
    console.error("[reading] Failed to fetch Open Library data:", err);
    return empty;
  }
}

async function _fetchCurrentBook(): Promise<CurrentBook> {
  const {
    title,
    author,
    rating,
    tags,
    storygraph,
    coverUrl: customCoverUrl,
  } = bookData;
  const isbn = bookData.isbn ?? null;

  // Use custom coverUrl if provided, otherwise fetch from Open Library
  let coverUrl = customCoverUrl ?? null;
  let openLibraryUrl: string | null = null;

  if (!coverUrl) {
    const result = await fetchOpenLibraryData(title, author, isbn);
    coverUrl = result.coverUrl;
    openLibraryUrl = result.openLibraryUrl;
  } else {
    // Still fetch Open Library URL even if custom cover is provided
    const result = await fetchOpenLibraryData(title, author, isbn);
    openLibraryUrl = result.openLibraryUrl;
  }

  return {
    title,
    author,
    isbn,
    rating,
    tags,
    storygraph: storygraph as StorygraphMeta,
    coverUrl,
    openLibraryUrl,
  };
}

// Module-level cache — shares one fetch per build across all pages
let _cache: Promise<CurrentBook> | null = null;

export function getCurrentBook(): Promise<CurrentBook> {
  return (_cache ??= _fetchCurrentBook());
}
