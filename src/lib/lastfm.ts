export type LastFmAlbum = {
  name: string;
  artist: string;
  playcount: number;
  imageUrl: string | null;
  lastFmUrl: string;
  odesliUrl: string | null;
  bandcampSearchUrl: string;
};

async function fetchAppleMusicUrl(
  artist: string,
  album: string,
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${artist} ${album}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album&limit=1`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0]?.collectionViewUrl ?? null;
  } catch {
    return null;
  }
}

async function fetchOdesliUrl(appleMusicUrl: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(appleMusicUrl)}&userCountry=US`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.pageUrl ?? null;
  } catch {
    return null;
  }
}

async function _fetchTopAlbum(): Promise<LastFmAlbum | null> {
  const apiKey = import.meta.env.LASTFM_API_KEY;
  const username = import.meta.env.LASTFM_USERNAME;

  if (!apiKey || !username) {
    console.warn(
      "[lastfm] LASTFM_API_KEY or LASTFM_USERNAME not set — skipping fetch.",
    );
    return null;
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getTopAlbums&user=${username}&api_key=${apiKey}&format=json&period=7day&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const album = data?.topalbums?.album?.[0];
    if (!album) return null;

    const imageUrl: string | null =
      album.image?.find(
        (i: { size: string; "#text": string }) => i.size === "extralarge",
      )?.["#text"] ||
      album.image?.find(
        (i: { size: string; "#text": string }) => i.size === "large",
      )?.["#text"] ||
      null;

    const lastFmUrl: string = album.url ?? "";
    if (!lastFmUrl) {
      console.warn("[lastfm] Album has no URL — skipping.");
      return null;
    }

    const artist: string = album.artist?.name ?? "";
    const name: string = album.name ?? "";
    const playcount = parseInt(album.playcount, 10) || 0;

    const odesliUrl = await fetchAppleMusicUrl(artist, name).then(
      (appleMusicUrl) => (appleMusicUrl ? fetchOdesliUrl(appleMusicUrl) : null),
    );
    const bandcampSearchUrl = `https://bandcamp.com/search?q=${encodeURIComponent(`${artist} ${name}`)}`;

    return {
      name,
      artist,
      playcount,
      imageUrl,
      lastFmUrl,
      odesliUrl,
      bandcampSearchUrl,
    };
  } catch (err) {
    console.error("[lastfm] Failed to fetch top album:", err);
    return null;
  }
}

// Module-level cache so multiple pages (index, listening) share one fetch per build
let _cache: Promise<LastFmAlbum | null> | null = null;

export function getTopAlbum(): Promise<LastFmAlbum | null> {
  return (_cache ??= _fetchTopAlbum());
}
