# Astro Best Practices Reference

Distilled from the official Astro docs, tailored to the patterns used in this project.

**Sources:**
- https://docs.astro.build/en/guides/client-side-scripts/
- https://docs.astro.build/en/guides/view-transitions/
- https://docs.astro.build/en/guides/content-collections/
- https://docs.astro.build/en/guides/styling/

---

## 1. Scripts & Client-Side Event Handling

### Use `astro:page-load` — not `DOMContentLoaded`

With View Transitions enabled, `DOMContentLoaded` only fires on the **initial hard load**, not after client-side navigations. Use `astro:page-load` instead — it fires both on first load and after every navigation.

```js
// ❌ Wrong — misses post-navigation re-execution
document.addEventListener("DOMContentLoaded", () => init());

// ✅ Correct
document.addEventListener("astro:page-load", () => init());
```

### `astro:after-swap` for theme/dark-mode initialization

`astro:after-swap` fires after the DOM is swapped but before paint. Use it for anything that must be applied before the new page is visible (e.g. dark mode class, accent color re-roll):

```js
document.addEventListener("astro:after-swap", applyTheme);
```

### Module scripts execute only once

Plain `<script>` tags (no `is:inline`) are bundled module scripts. They execute **once per session** — not on every navigation. The event listener pattern handles re-execution:

```js
// Script body runs once (first load)
// Event listener handles subsequent navigations
document.addEventListener("astro:page-load", () => {
  document.querySelector(".menu").addEventListener("click", toggle);
});
```

### Use `querySelectorAll` for repeated elements

When a component may appear multiple times on a page, use `querySelectorAll` (not `querySelector`) so the script acts on all instances:

```js
// ❌ Only affects the first instance
document.querySelector("[data-tag-pill]").style.backgroundColor = color;

// ✅ Affects all instances
document.querySelectorAll("[data-tag-pill]").forEach(el => {
  el.style.backgroundColor = color;
});
```

### Use `data-*` attributes to pass server values to scripts

Frontmatter variables run on the server and are not available in `<script>` blocks. Pass them via `data-*` attributes:

```astro
---
const { color } = Astro.props;
---
<div data-accent-color={color}>...</div>

<script>
  const color = document.querySelector("[data-accent-color]").dataset.accentColor;
</script>
```

### Prefer Custom Elements for stateful/reusable components

When a component is used multiple times on a page, Custom Elements (Web Components) scope `this.querySelector()` to the individual instance, avoiding cross-instance interference:

```astro
<my-widget data-message={message}>
  <button>Click</button>
</my-widget>

<script>
  class MyWidget extends HTMLElement {
    connectedCallback() {
      // `this` = this specific instance only
      const msg = this.dataset.message;
      this.querySelector("button").addEventListener("click", () => alert(msg));
    }
  }
  customElements.define("my-widget", MyWidget);
</script>
```

---

## 2. View Transitions

### Enable site-wide with `<ClientRouter />` in the layout

```astro
---
import { ClientRouter } from "astro:transitions";
---
<head>
  <ClientRouter />
</head>
```

### Use `transition:persist` for elements that should survive navigation

```astro
<!-- Header persists across navigations — state and DOM node are preserved -->
<header transition:persist>...</header>
```

### Lifecycle event order

```
astro:before-preparation  → content about to load
astro:after-preparation   → content loaded, before DOM swap
astro:before-swap         → about to swap DOM
astro:after-swap          → DOM swapped, before paint      ← theme init goes here
astro:page-load           → fully complete                 ← script re-init goes here
```

### Module scripts and navigation

Module scripts run once. Inline scripts (`is:inline`) may re-run. If an inline script sets global state, guard against double-execution:

```js
if (!window.MyGlobal) {
  window.MyGlobal = {};
}
```

Force an inline script to re-run on every navigation with `data-astro-rerun`:

```astro
<script is:inline data-astro-rerun>
  // runs after every navigation
</script>
```

---

## 3. Content Collections

### Always define a Zod schema

Schemas provide build-time validation, TypeScript autocompletion, and catch missing/misspelled frontmatter fields before production:

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    draft: z.boolean().optional(),
  }),
});
```

### Use `reference()` for cross-collection relationships

Instead of raw string slugs (which fail silently at runtime), use `reference()` for foreign-key style relationships. Astro validates the referenced entry exists at build time:

```ts
import { defineCollection, reference, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    series: reference("series").optional(),
  }),
});
```

Then resolve with `getEntry()` instead of a manual `.find()`:

```ts
// ❌ Raw string — no build-time validation
const seriesEntry = allSeries.find(s => s.slug === post.data.series);

// ✅ reference() + getEntry() — validated at build time
const seriesEntry = post.data.series
  ? await getEntry(post.data.series)
  : undefined;
```

### Sort `getCollection()` results explicitly

`getCollection()` return order is **non-deterministic**. Always sort explicitly:

```ts
const posts = (await getCollection("blog"))
  .filter(p => !p.data.draft)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

### Pass data through `getStaticPaths()` props — don't re-fetch

In static pages, `getStaticPaths()` runs once. Compute all derived data there and pass as props rather than calling `getCollection()` again in the component body:

```ts
// ✅ Compute prev/next in getStaticPaths, pass as props
export async function getStaticPaths() {
  const posts = (await getCollection("blog"))
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return posts.map((post, index) => ({
    params: { slug: post.slug },
    props: { post, prevPost: posts[index - 1], nextPost: posts[index + 1] },
  }));
}
```

### Filter drafts based on environment

Show drafts in development so you can preview them; hide in production only:

```ts
// ❌ Hides drafts everywhere, including local dev
.filter(post => !post.data.draft)

// ✅ Hides drafts only in production
.filter(post => import.meta.env.PROD ? !post.data.draft : true)
```

---

## 4. Styles & CSS

### Scoped styles are the default — prefer them

`<style>` tags in `.astro` components are scoped to that component automatically. Use them as the primary styling mechanism:

```astro
<style>
  h1 { color: red; } /* only affects h1 inside this component */
</style>
```

### Use `is:global` sparingly

Reserve `<style is:global>` for truly global concerns (base resets, typography). Be aware it applies to the entire document, including child components.

### Pass a `class` prop explicitly

`class` does not automatically forward to child components. Accept it as a prop:

```astro
---
const { class: className } = Astro.props;
---
<div class={className}>
  <slot />
</div>
```

### Use `define:vars` to bridge frontmatter → CSS

```astro
---
const accentColor = "#00FFFF";
---
<style define:vars={{ accentColor }}>
  .card { border-color: var(--accentColor); }
</style>
```

### CSS cascade order (lowest → highest precedence)

1. `<link>` tags in `<head>`
2. Imported stylesheets
3. Scoped component styles

---

## Project-Specific Notes

See `STANDARDS.md` → **Astro Runtime Accent Theming** for conventions specific to this site's accent color system (sentinel `data-*` attributes, `data-accent-override` guard pattern, canonical color values).
