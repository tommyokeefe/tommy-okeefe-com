export type StreamingLink = { name: string; url: string };

export type StreamingLinks = {
  listen: StreamingLink[];
  buy: StreamingLink[];
  odesliUrl: string | null;
  bandcampFallbackUrl: string;
};

export type LastFmAlbum = {
  name: string;
  artist: string;
  imageUrl: string | null;
  lastFmUrl: string;
  chartUrl: string;
  streaming: StreamingLinks;
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

const LISTEN_PLATFORMS: { key: string; name: string }[] = [
  { key: "appleMusic", name: "Apple Music" },
  { key: "spotify", name: "Spotify" },
  { key: "tidal", name: "Tidal" },
  { key: "youtubeMusic", name: "YouTube Music" },
  { key: "amazonMusic", name: "Amazon Music" },
  { key: "pandora", name: "Pandora" },
];

const BUY_PLATFORMS: { key: string; name: string }[] = [
  { key: "bandcamp", name: "Bandcamp" },
  { key: "itunes", name: "iTunes" },
  { key: "amazonStore", name: "Amazon" },
];

async function fetchOdesliLinks(
  appleMusicUrl: string,
  bandcampFallbackUrl: string,
): Promise<StreamingLinks> {
  const empty: StreamingLinks = {
    listen: [],
    buy: [],
    odesliUrl: null,
    bandcampFallbackUrl,
  };
  try {
    const res = await fetch(
      `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(appleMusicUrl)}&userCountry=US`,
    );
    if (!res.ok) return empty;
    const data = await res.json();
    const byPlatform: Record<string, { url: string }> =
      data?.linksByPlatform ?? {};
    const odesliUrl: string | null = data?.pageUrl ?? null;

    const listen: StreamingLink[] = LISTEN_PLATFORMS.flatMap(({ key, name }) =>
      byPlatform[key]?.url ? [{ name, url: byPlatform[key].url }] : [],
    );
    const buy: StreamingLink[] = BUY_PLATFORMS.flatMap(({ key, name }) =>
      byPlatform[key]?.url ? [{ name, url: byPlatform[key].url }] : [],
    );

    return { listen, buy, odesliUrl, bandcampFallbackUrl };
  } catch {
    return empty;
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
    const chartUrl = `https://www.last.fm/user/${username}/library/albums?date_preset=LAST_7_DAYS`;

    const bandcampFallbackUrl = `https://bandcamp.com/search?q=${encodeURIComponent(`${artist} ${name}`)}`;
    const streaming = await fetchAppleMusicUrl(artist, name).then(
      (appleMusicUrl) =>
        appleMusicUrl
          ? fetchOdesliLinks(appleMusicUrl, bandcampFallbackUrl)
          : {
              listen: [],
              buy: [],
              odesliUrl: null,
              bandcampFallbackUrl,
            },
    );

    return {
      name,
      artist,
      imageUrl,
      lastFmUrl,
      chartUrl,
      streaming,
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
