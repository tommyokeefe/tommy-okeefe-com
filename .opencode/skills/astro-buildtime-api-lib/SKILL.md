---
name: astro-buildtime-api-lib
description: Playbook for adding a new build-time API data source to an Astro SSG project. Creates a typed src/lib/*.ts utility with singleton cache, env var guard, error handling, and null-safe returns. Wires it to a page and component with an explicit empty state.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: astro
---

# astro-buildtime-api-lib

Add a new build-time API data source to an Astro static site — correctly shaped, cached, null-safe, and wired to a consumer component with a graceful empty state.

## Purpose

Astro SSG fetches all external data at build time, not at runtime. This skill ensures every new API integration follows the same canonical shape: a singleton-cached `src/lib/*.ts` module that fetches once per build, returns a typed result or `null` on any failure, and is consumed by a component that renders an explicit empty state.

Derived from two @REFLECTOR-approved instances: `src/lib/lastfm.ts` (Last.fm → Odesli) and `src/lib/reading.ts` (Open Library enrichment). See the Known Exception section for `src/lib/accents.ts`.

## When to Use

Load this skill when the task is:
- Adding a new external API data source to the site
- Creating a new `src/lib/*.ts` build-time utility
- Adding a new sidebar widget or detail page backed by fetched data
- Enriching a local `src/data/*.json` file with remote API data at build time

## Prerequisites

- Astro SSG project (not SSR)
- API endpoint identified and response shape understood
- Whether the API requires authentication (determines env var guard presence)
- Target component and/or page that will consume the data

## Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `{{ v_lib_name }}` | string | yes | Filename without extension (e.g., `github`, `readwise`) — becomes `src/lib/{{ v_lib_name }}.ts` |
| `{{ v_type_name }}` | string | yes | Exported TypeScript type name (e.g., `GithubActivity`, `ReadwiseBook`) |
| `{{ v_accessor_name }}` | string | yes | Exported accessor function name (e.g., `getGithubActivity`, `getLatestBook`) |
| `{{ v_env_var }}` | string | if authenticated | Env var name for the API key (e.g., `GITHUB_TOKEN`). Omit for public APIs. |
| `{{ v_data_file }}` | string | if JSON-backed | Filename of source-of-truth JSON **without extension** (e.g., `current-reading`) — becomes `src/data/{{ v_data_file }}.json`. |
| `{{ v_empty_state_text }}` | string | yes | Human-readable fallback text rendered when data is `null` (e.g., `"Nothing scrobbled yet this week."`) |

## Example Usage

Adding a GitHub activity widget:

| Parameter | Value |
|---|---|
| `{{ v_lib_name }}` | `github` |
| `{{ v_type_name }}` | `GithubActivity` |
| `{{ v_accessor_name }}` | `getGithubActivity` |
| `{{ v_env_var }}` | `GITHUB_TOKEN` |
| `{{ v_data_file }}` | *(omit — not JSON-backed)* |
| `{{ v_empty_state_text }}` | `"No recent activity."` |

**Produces:**
1. `src/lib/github.ts` — singleton-cached, authenticated API lib
2. `src/components/GithubWidget.astro` — explicit empty state
3. `src/pages/index.astro` frontmatter update — wires accessor to component
4. `.env` + `.env.example` — `GITHUB_TOKEN=` documented

## Playbook

### Step 1 — Create `src/lib/{{ v_lib_name }}.ts`

Follow the canonical shape exactly. Do not deviate.

**For authenticated APIs (env var required):**

```ts
// src/lib/{{ v_lib_name }}.ts

export type {{ v_type_name }} = {
  // Only include fields consumed by at least one caller.
  // Remove dead fields immediately — do not leave placeholders.
};

async function _fetch(): Promise<{{ v_type_name }} | null> {
  const apiKey = import.meta.env.{{ v_env_var }};
  if (!apiKey) {
    console.warn("[{{ v_lib_name }}] {{ v_env_var }} not set — skipping fetch.");
    return null;
  }

  try {
    const res = await fetch("https://api.example.com/endpoint", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    // Transform and return only the fields defined on {{ v_type_name }}.
    return {
      // ...
    };
  } catch (err) {
    console.error("[{{ v_lib_name }}] Failed to fetch:", err);
    return null;
  }
}

let _cache: Promise<{{ v_type_name }} | null> | null = null;

export function {{ v_accessor_name }}(): Promise<{{ v_type_name }} | null> {
  return (_cache ??= _fetch());
}
```

**For public APIs (no auth required):**

Omit the env var guard entirely. Add the inline exception comment:

```ts
async function _fetch(): Promise<{{ v_type_name }} | null> {
  // No env var guard — this is a public API (no key required).
  try {
    // ...
  } catch (err) {
    console.error("[{{ v_lib_name }}] Failed to fetch:", err);
    return null;
  }
}
```

**For JSON-backed integrations (`src/data/*.json` enriched by API):**

Two sub-cases apply. Choose based on whether the JSON file is a guaranteed source of truth:

*Sub-case A — JSON is a committed, guaranteed source of truth (e.g., `reading.ts`):*

The JSON file exists in the repo and is always present at build time. A missing file is a build error, not a recoverable condition. The accessor returns `Promise<T>` — never null. The consumer prop type is `T`, not `T | null`. The explicit empty-state rule does not apply to the base data (though optional enrichment fields like `coverUrl` may still be nullable).

```ts
import rawData from "../data/{{ v_data_file }}.json";

export type {{ v_type_name }} = {
  // Required fields from the JSON — always present.
  // Optional enrichment fields — may be null if API call fails.
  coverUrl: string | null;
  canonicalUrl: string | null;
};

async function _fetch(): Promise<{{ v_type_name }}> {
  // No env var guard — enrichment API is public.
  // rawData is always present — it is a committed JSON file.
  try {
    // Enrich with remote data.
    const coverUrl = await fetchCoverUrl(rawData) ?? null;
    const canonicalUrl = await fetchCanonicalUrl(rawData) ?? null;
    return { ...rawData, coverUrl, canonicalUrl };
  } catch (err) {
    console.error("[{{ v_lib_name }}] Failed to enrich data:", err);
    // Fall back to the raw data with null enrichment fields.
    return { ...rawData, coverUrl: null, canonicalUrl: null };
  }
}

let _cache: Promise<{{ v_type_name }}> | null = null;

export function {{ v_accessor_name }}(): Promise<{{ v_type_name }}> {
  return (_cache ??= _fetch());
}
```

*Sub-case B — JSON is optional or enrichment failure should suppress the widget:*

Use the standard `Promise<{{ v_type_name }} | null>` return type (same as authenticated/public variants). The consumer must render an explicit empty state.

### Step 2 — Add env var to `.env` and `.env.example`

If the integration is authenticated:

```sh
# .env (gitignored — real value)
{{ v_env_var }}=your_actual_key_here

# .env.example (committed — documents the var for future developers)
{{ v_env_var }}=    # API key for <service name> — obtain at <URL>
```

Skip this step for public API integrations.

### Step 3 — Create or update the consumer component

**For `T | null` return types** (authenticated, public, or JSON Sub-case B):

The component receives `{{ v_type_name }} | null` as a prop. It must render an explicit empty state — never silently render nothing.

```astro
---
// src/components/MyWidget.astro
import type { {{ v_type_name }} } from "@lib/{{ v_lib_name }}";

type Props = {
  data: {{ v_type_name }} | null;
};

const { data } = Astro.props;
---

{data ? (
  <!-- Render real content -->
  <div>...</div>
) : (
  <p class="text-sm text-black/50 dark:text-white/50">
    {{ v_empty_state_text }}
  </p>
)}
```

**For `T` return types** (JSON Sub-case A):

The component receives `{{ v_type_name }}` as a prop (no null). Render the data directly; handle only the nullable enrichment fields conditionally.

```astro
---
// src/components/MyWidget.astro
import type { {{ v_type_name }} } from "@lib/{{ v_lib_name }}";

type Props = {
  data: {{ v_type_name }};
};

const { data } = Astro.props;
---

<div>
  <!-- Required fields always present -->
  <h2>{data.title}</h2>
  <!-- Nullable enrichment fields — guard inline -->
  {data.coverUrl && <img src={data.coverUrl} alt="cover" />}
</div>
```

### Step 4 — Wire the lib to the consuming page

In the Astro page frontmatter, call the accessor and pass the result as a prop:

```astro
---
// src/pages/index.astro (or any page)
import { {{ v_accessor_name }} } from "@lib/{{ v_lib_name }}";
import MyWidget from "@components/MyWidget.astro";

const data = await {{ v_accessor_name }}();
---

<MyWidget data={data} />
```

### Step 5 — Verify

Run the build and confirm:

```sh
npm run build    # Must complete without errors
npm run preview  # Visually verify real data and empty state
```

For empty state verification (authenticated / public APIs): temporarily set the env var to an invalid value or point to a bad endpoint and confirm the fallback renders. For JSON-backed (Sub-case A), verify the enrichment-field fallback by blocking the enrichment network call.

## Rules & Constraints

All of these are enforced by @REFLECTOR:

- **Singleton cache is mandatory.** Multiple pages may import the same lib. Without the cache, every page would trigger a separate API call. The `_cache ??= _fetch()` pattern ensures one fetch per build.
- **Never throw — always return `null` (or fall back to base data for JSON Sub-case A).** Callers assume `T | null`. A thrown error would crash the entire build.
- **Lean types only.** Every field on the exported type must be consumed by at least one current caller. Remove dead fields before @REFLECTOR review.
- **No hardcoded user-specific URLs in templates.** If a URL includes a username or ID already present in an env var (e.g., a profile link), construct the URL in the lib and surface it on the return type. Templates must be env-agnostic.
- **Explicit empty state.** Rendering nothing silently when data is `null` is a bug. Every consumer must have a visible fallback (applies to `T | null` return types).
- **External link security.** Any external link rendered by the consumer must use `target="_blank"` + `rel="noopener noreferrer"`. Use the shared `Link.astro` component with the `external` prop — never set these attributes individually at call sites.

## Multi-Source Link Fallback (Optional)

When the primary link source may be unavailable (e.g., Odesli link for a streaming platform), resolve a fallback at fetch time:

```ts
const preferredUrl = await fetchOdesliUrl(trackUrl) ?? null;
const fallbackUrl = `https://bandcamp.com/search?q=${encodeURIComponent(query)}`;

return {
  preferredUrl,
  fallbackUrl, // Always present — constructed at fetch time, not in template
};
```

Template:

```astro
<a href={data.preferredUrl ?? data.fallbackUrl}>Listen</a>
```

Never construct fallback URLs in the template — they belong in the lib.

## Grouped Platform Classification (Optional)

For APIs that return a flat platform map (e.g., Odesli), classify into semantic groups using ordered priority arrays:

```ts
const LISTEN_PLATFORMS: { key: string; name: string }[] = [
  { key: "appleMusic", name: "Apple Music" },
  { key: "spotify", name: "Spotify" },
  // ... ordered by user-relevance
];

const listen = LISTEN_PLATFORMS.flatMap(({ key, name }) =>
  byPlatform[key]?.url ? [{ name, url: byPlatform[key].url }] : []
);
```

Return as a typed envelope:

```ts
export type StreamingLinks = {
  listen: StreamingLink[];
  buy: StreamingLink[];
  aggregatorUrl: string | null;
  fallbackUrl: string;
};
```

## Output

This skill produces:

1. `src/lib/{{ v_lib_name }}.ts` — singleton-cached build-time utility
2. Updated `src/components/MyWidget.astro` — or a new component with explicit empty state (or non-nullable prop for JSON Sub-case A)
3. Updated page frontmatter wiring the accessor
4. Updated `.env` + `.env.example` (authenticated APIs only)

## Framework Compliance

- ✅ **Traceability** — lib name, type, and accessor are explicit and searchable
- ✅ **Security** — env var guard prevents silent data exposure; no credentials in source
- ✅ **Simplicity** — one file, one responsibility, one public accessor
- ✅ **Idempotency** — singleton cache makes re-running build safe; `null` returns are stable
- ✅ **Artifact Minimalism** — only the lib, consumer update, and env example are produced

## Related Standards

- `STANDARDS.md` § "Build-Time API Integrations (`src/lib/*.ts`)"
- `STANDARDS.md` § "Astro Content Collection Schema — `getStaticPaths` is the single data-fetching boundary"

## Known Exception — `src/lib/accents.ts`

`accents.ts` historically inspired the singleton-cached typed accessor pattern, but it is **not** an instance of this skill. It exports a synchronous `getHeaderAccent()` function with no `_cache` promise variable and does not call any external API — it derives accent data from a local `ACCENTS` constant. Its accessor pattern (one exported function, typed return) is the ancestral origin of this skill's shape, but it predates and does not conform to the full playbook above.
