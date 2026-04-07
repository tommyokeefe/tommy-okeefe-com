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
  storygraph: StorygraphMeta;
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
    // Note: Open Library Covers returns a 1×1 blank GIF (not 404) for unknown ISBNs,
    // so coverUrl will be non-null even when no cover exists.
    const isbnCoverUrl = isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : null;

    // Always search for the Open Library page URL (and cover fallback if no ISBN)
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1&fields=key,cover_i`,
    );
    if (!res.ok) return { coverUrl: isbnCoverUrl, openLibraryUrl: null };
    const data = await res.json();
    const doc = data?.docs?.[0];
    if (!doc) return { coverUrl: isbnCoverUrl, openLibraryUrl: null };

    const openLibraryUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;

    // Fall back to cover_i if no ISBN was provided
    const coverId: number | null = doc.cover_i ?? null;
    const coverUrl =
      isbnCoverUrl ??
      (coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null);

    return { coverUrl, openLibraryUrl };
  } catch (err) {
    console.error("[reading] Failed to fetch Open Library data:", err);
    return empty;
  }
}

async function _fetchCurrentBook(): Promise<CurrentBook> {
  const { title, author, rating, tags, storygraph } = bookData;
  const isbn = bookData.isbn ?? null;

  const { coverUrl, openLibraryUrl } = await fetchOpenLibraryData(
    title,
    author,
    isbn,
  );

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
