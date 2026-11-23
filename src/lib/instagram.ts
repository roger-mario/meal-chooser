import "server-only";

// Reading recipes from public Instagram posts and reels.
//
// - One post: Instagram's oEmbed endpoint gives the caption, the creator and a preview picture.
//   With META_APP_TOKEN ("app-id|client-token") the official Graph oEmbed endpoint is used instead.
// - A creator's latest reels: only through Meta's Business Discovery API, which needs an
//   Instagram professional account of our own (INSTAGRAM_BUSINESS_ID) and its access token
//   (INSTAGRAM_GRAPH_TOKEN). Without them, paste the links of the reels instead.
// No logins, no private endpoints, one request at a time.

const GRAPH = "https://graph.facebook.com/v21.0";

export type InstagramPost = {
  permalink: string;
  shortcode: string;
  caption: string;
  creator: string | null;
  creatorUrl: string | null;
  thumbnailUrl: string | null;
  isVideo: boolean | null;
};

/** Accepts instagram.com/p/…, /reel/…, /reels/… and /tv/… links; returns the canonical link and code. */
export function parseInstagramUrl(raw: string): { permalink: string; shortcode: string } | null {
  const value = raw.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;
  const m = url.pathname.match(/^\/(?:[\w.]+\/)?(p|reels?|tv)\/([\w-]{5,40})/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "p" ? "p" : m[1].toLowerCase() === "tv" ? "tv" : "reel";
  return { permalink: `https://www.instagram.com/${kind}/${m[2]}/`, shortcode: m[2] };
}

/** "@adam.wolfe", "instagram.com/adam.wolfe/reels" → "adam.wolfe" */
export function parseUsername(raw: string): string | null {
  const value = raw.trim().replace(/^@/, "");
  const fromUrl = value.match(/instagram\.com\/([\w.]{1,30})/i)?.[1];
  const name = (fromUrl ?? value).replace(/\/.*$/, "");
  return /^[\w.]{1,30}$/.test(name) ? name.toLowerCase() : null;
}

/** Caption, creator and preview picture of one public post or reel. */
export async function fetchInstagramPost(link: string): Promise<InstagramPost> {
  const parsed = parseInstagramUrl(link);
  if (!parsed) throw new Error("That isn't a link to an Instagram post or reel.");
  const token = process.env.META_APP_TOKEN;
  const endpoint = token
    ? `${GRAPH}/instagram_oembed?url=${encodeURIComponent(parsed.permalink)}&access_token=${encodeURIComponent(token)}`
    : `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(parsed.permalink)}`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      headers: { "user-agent": "otao-recipe-import/1.0", accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new Error("Instagram didn't answer. Try again in a minute.");
  }
  if (res.status === 404) throw new Error("Instagram says this post doesn't exist or isn't public.");
  if (res.status === 429) throw new Error("Instagram asks us to slow down. Wait a few minutes and try again.");
  if (!res.ok) throw new Error(`Instagram answered with an error (HTTP ${res.status}).`);
  const data = (await res.json().catch(() => null)) as {
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
  } | null;
  const caption = data?.title?.trim() ?? "";
  if (!caption) throw new Error("This post has no caption, so there's no recipe to read.");
  return {
    ...parsed,
    caption,
    creator: data?.author_name ?? null,
    creatorUrl: data?.author_url ?? (data?.author_name ? `https://www.instagram.com/${data.author_name}/` : null),
    thumbnailUrl: data?.thumbnail_url?.startsWith("https://") ? data.thumbnail_url : null,
    isVideo: parsed.permalink.includes("/reel/") ? true : null,
  };
}

export function creatorListingAvailable() {
  return Boolean(process.env.INSTAGRAM_GRAPH_TOKEN && process.env.INSTAGRAM_BUSINESS_ID);
}

type DiscoveryMedia = {
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
};

/**
 * The creator's latest reels (newest first) through Meta's Business Discovery API.
 * Works for public professional (creator/business) accounts only. Returns null when not set up.
 */
export async function listCreatorReels(username: string, limit = 25): Promise<InstagramPost[] | null> {
  const token = process.env.INSTAGRAM_GRAPH_TOKEN;
  const me = process.env.INSTAGRAM_BUSINESS_ID;
  if (!token || !me) return null;
  const n = Math.min(Math.max(limit, 1), 50);
  const fields = `business_discovery.username(${username}){username,media.limit(${n}){caption,media_type,media_product_type,permalink,thumbnail_url,media_url}}`;
  const res = await fetch(`${GRAPH}/${encodeURIComponent(me)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`, {
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as {
    business_discovery?: { username?: string; media?: { data?: DiscoveryMedia[] } };
    error?: { message?: string };
  } | null;
  if (!res.ok || !data?.business_discovery) {
    throw new Error(data?.error?.message ?? `Instagram answered with an error (HTTP ${res.status}).`);
  }
  const creator = data.business_discovery.username ?? username;
  return (data.business_discovery.media?.data ?? []).flatMap((m) => {
    const parsed = m.permalink ? parseInstagramUrl(m.permalink) : null;
    if (!parsed || !m.caption?.trim()) return [];
    const isVideo = m.media_type === "VIDEO" || m.media_product_type === "REELS";
    const thumb = isVideo ? m.thumbnail_url : m.media_url;
    return [
      {
        ...parsed,
        caption: m.caption.trim(),
        creator,
        creatorUrl: `https://www.instagram.com/${creator}/`,
        thumbnailUrl: thumb?.startsWith("https://") ? thumb : null,
        isVideo,
      },
    ];
  });
}
