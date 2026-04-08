---
name: astro-runtime-accent-theming
description: Playbook for adding runtime accent color theming to a new Astro component. Imports getHeaderAccent() from the canonical src/lib/accents.ts module, wires astro:page-load and a dark-mode MutationObserver, and applies the correct color values via inline style. Covers the standard pattern, the dual-observer variant for transition:persist components, and the two permanent exceptions (is:inline and SSR build-time Tailwind class selection).
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: astro
---

# astro-runtime-accent-theming

Wire a new Astro component to the site's runtime accent theming system — correctly sourced, correctly observed, and correctly scoped.

## Purpose

The site's three-color accent system (cyan / magenta / yellow) is applied at runtime via JavaScript. The active accent name is stored on `<header data-header-accent="...">` and re-rolled on every `astro:after-swap` by `Header.astro`. Accent color values come from a single canonical module: `src/lib/accents.ts`.

This skill ensures every new accent-aware component imports from the canonical module, follows the correct observer shape, and handles the View Transitions lifecycle correctly — avoiding the systemic duplication and lifecycle bugs that prompted this skill's creation.

Derived from five @REFLECTOR-approved instances: `TableOfContents.astro`, `BackToPrevious.astro`, `PostNavigation.astro`, `BackToTop.astro` (Custom Element variant), and the series-card accent fix in `[...slug].astro`. All were migrated to import from `@lib/accents` during the "Fix Finding 9" Journey.

## When to Use

Load this skill when the task is:
- Adding a new Astro component that should reflect the page's active accent color
- Applying accent color to a border, background gradient, or text decoration via JavaScript
- Auditing an existing component for inline `ACCENTS` table declarations (to be replaced with the canonical import)
- Debugging an accent that reads the wrong color after a client-side navigation

## Prerequisites

- `src/lib/accents.ts` exists at the project root (it does — do not recreate it)
- The component is an Astro component (`.astro` file) with a `<script>` block
- The component's accent must be applied client-side (runtime DOM access required — not SSR/frontmatter)
- Confirm which variant applies: standard script or Custom Element (see Step 1)

## Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `{{ v_component_name }}` | string | yes | Component filename without extension (e.g., `MySidebar`, `ReadingProgress`) |
| `{{ v_apply_fn_name }}` | string | yes | Name of the apply function inside the script (e.g., `applyReadingProgressAccent`) |
| `{{ v_sentinel_attr }}` | string | if scoped | `data-*` attribute name used to scope querySelector to this component's elements (e.g., `data-reading-progress`). Omit if the component targets a single known element (e.g., `this` in a Custom Element). |
| `{{ v_accent_properties }}` | string | yes | Which accent properties to apply and to which CSS properties. Describe in plain English (e.g., `backgroundColor = gradientDark/Light; borderBottom = "1px solid dark/light"`). |
| `{{ v_is_persist }}` | boolean | yes | `true` if the component is inside a `transition:persist` element or is itself `transition:persist`. Determines whether the dual-observer variant is required. |
| `{{ v_ce_tag_name }}` | string | if CE variant | kebab-case custom element tag name (e.g., `reading-progress-bar`). Must be a valid custom element name — lowercase, hyphen-separated, at least one hyphen. Required only when `{{ v_is_persist }}` is `true`. |

## Example Usage

Adding a reading-progress bar that reflects the page accent:

| Parameter | Value |
|---|---|
| `{{ v_component_name }}` | `ReadingProgress` |
| `{{ v_apply_fn_name }}` | `applyReadingProgressAccent` |
| `{{ v_sentinel_attr }}` | `data-reading-progress` |
| `{{ v_accent_properties }}` | `backgroundColor = dark ? gradientDark : gradientLight; borderBottom = "1px solid " + (dark ? dark : light)` |
| `{{ v_is_persist }}` | `false` |
| `{{ v_ce_tag_name }}` | *(omit — standard variant)* |

**Produces:**
1. `src/components/ReadingProgress.astro` — new component with canonical `<script>` accent wiring
2. `data-reading-progress` sentinel attribute added to the progress bar element in the template

## Playbook

### Step 1 — Choose the correct variant

Two variants exist. Choose based on whether the component is `transition:persist`:

- **Standard `<script>` variant** — use when `{{ v_is_persist }}` is `false`. The component is re-mounted on every page load; `astro:page-load` fires reliably after the DOM is ready.
- **Custom Element variant** — use when `{{ v_is_persist }}` is `true`. `transition:persist` components survive View Transition swaps without re-mounting; a single `astro:page-load` listener would not re-fire to update the accent. The CE lifecycle (`connectedCallback` + `disconnectedCallback`) is required. See Step 3.

### Step 2 — Standard `<script>` variant (when `{{ v_is_persist }}` is `false`)

Add the following `<script>` block to `src/components/{{ v_component_name }}.astro`:

```ts
<script>
  import { getHeaderAccent } from "@lib/accents";

  function {{ v_apply_fn_name }}() {
    const dark = document.documentElement.classList.contains("dark");
    const accent = getHeaderAccent();

    document.querySelectorAll<HTMLElement>("[{{ v_sentinel_attr }}]").forEach((el) => {
      // Apply {{ v_accent_properties }}
    });
  }

  document.addEventListener("astro:page-load", {{ v_apply_fn_name }});

  const observer = new MutationObserver({{ v_apply_fn_name }});
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
</script>
```

**Reference — `TableOfContents.astro` (canonical standard-variant implementation):**

```ts
function applyTocAccent() {
  const dark = document.documentElement.classList.contains("dark");
  const accent = getHeaderAccent();
  document.querySelectorAll<HTMLElement>("[data-toc-summary]").forEach((el) => {
    el.style.backgroundColor = dark ? accent.gradientDark : accent.gradientLight;
    el.style.borderBottom = `1px solid ${dark ? accent.dark : accent.light}`;
  });
}
```

Use this as the concrete model for standard accent application. The exact CSS properties you apply are determined by `{{ v_accent_properties }}`.

**Notes:**
- `astro:page-load` handles both hard load and View Transitions client-side navigation.
- The `MutationObserver` on `document.documentElement` with `attributeFilter: ["class"]` reacts to dark-mode class changes.
- Do **not** use `DOMContentLoaded` (fires on hard load only) or `astro:after-swap` (fires before DOM is ready).
- If `{{ v_sentinel_attr }}` is omitted (single known element), use a direct `document.querySelector` instead of `querySelectorAll`.

### Step 3 — Custom Element variant (when `{{ v_is_persist }}` is `true`)

```astro
<script>
  import { getHeaderAccent } from "@lib/accents";

  class {{ v_component_name }} extends HTMLElement {
    private observer: MutationObserver | null = null;
    private headerObserver: MutationObserver | null = null;

    connectedCallback() {
      // Wire any click/keyboard handlers here first — they are torn down
      // automatically when the element is disconnected.
      // e.g.: this.querySelector("button")?.addEventListener("click", () => { ... });

      this.applyAccent();

      // Re-apply when dark mode toggles (documentElement class changes).
      this.observer = new MutationObserver(() => this.applyAccent());
      this.observer.observe(document.documentElement, {
        attributeFilter: ["class"],
      });

      // Re-apply when the header accent re-rolls after a View Transition.
      // connectedCallback fires mid-swap before Header.astro re-rolls
      // data-header-accent, so we must watch the attribute for the update.
      const headerEl = document.querySelector("header");
      if (headerEl) {
        this.headerObserver = new MutationObserver(() => this.applyAccent());
        this.headerObserver.observe(headerEl, {
          attributeFilter: ["data-header-accent"],
        });
      }
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.observer = null;
      this.headerObserver?.disconnect();
      this.headerObserver = null;
    }

    applyAccent() {
      const el = this.querySelector<HTMLElement>("/* target selector */");
      if (!el) return;
      const dark = document.documentElement.classList.contains("dark");
      const accent = getHeaderAccent();
      // Apply {{ v_accent_properties }}
    }
  }

  customElements.define("{{ v_ce_tag_name }}", {{ v_component_name }});
</script>
```

**Why the dual observer is required:** `connectedCallback` fires during the View Transition swap, *before* `Header.astro` has re-rolled `data-header-accent` for the new page. Without `headerObserver`, the CE reads the previous page's accent on the first call and never updates until the next dark-mode toggle. The `headerObserver` catches `data-header-accent` changes and calls `applyAccent()` again with the correct value.

### Step 4 — Add the sentinel attribute to the template

In the Astro template (above the `<script>` block), add `{{ v_sentinel_attr }}` to the element that `{{ v_apply_fn_name }}` will target:

```astro
<!-- Standard variant: add data-* to the element that receives inline styles -->
<div {{ v_sentinel_attr }} class="...">
  <!-- content -->
</div>
```

For Custom Element variants, use `this.querySelector(...)` inside `applyAccent()` — no sentinel attribute needed unless multiple child elements are targeted.

### Step 5 — Handle third-party component conflicts (if applicable)

If this component wraps a child component that also applies accent styles to its elements (e.g., `ArrowCard` applies its own gradient), add `data-accent-override="true"` to the element from this component's script and guard the child's selector with `:not([data-accent-override])`:

```ts
// In {{ v_apply_fn_name }}:
el.setAttribute("data-accent-override", "true");

// In the child component's applyCardGradients():
document.querySelectorAll<HTMLElement>("a.card:not([data-accent-override])").forEach(...)
```

Skip this step if no child component conflicts are present.

### Step 6 — Verify

```sh
npm run build    # Must complete without errors
```

Then open the site in a browser and:
1. Navigate to a page that renders `{{ v_component_name }}`.
2. Confirm the accent color matches the header (cyan, magenta, or yellow).
3. Toggle dark mode — confirm the color updates immediately (MutationObserver).
4. Navigate to a different page via a header nav link (client-side navigation) — confirm the accent re-rolls correctly.
5. If `{{ v_is_persist }}` is `true`: confirm the accent updates correctly after the View Transition completes (not stuck on the previous page's accent).

Run the full Cypress suite:

```sh
npx cypress run    # All tests must pass
```

## Rules & Constraints

All of these are enforced by @REFLECTOR:

- **Never re-declare `ACCENTS` inline.** The canonical module is `src/lib/accents.ts`. Any inline `const ACCENTS = { ... }` or local `getHeaderAccent` function in a `<script>` block is a violation — replace it with `import { getHeaderAccent } from "@lib/accents"`. There are exactly two permanent exceptions; see below.
- **Always use `astro:page-load`, never `DOMContentLoaded`.** `DOMContentLoaded` fires on hard load only. `astro:page-load` fires on both hard load and after every View Transitions client-side navigation. Using `DOMContentLoaded` silently breaks theming on client-side navigations.
- **Dark-mode observer is mandatory.** Every accent-aware component must watch `document.documentElement` with `attributeFilter: ["class"]` and re-apply when the class changes. Without this, toggling dark mode after page load leaves the accent stale.
- **Dual observer is required for `transition:persist` components.** Any component inside or as a `transition:persist` element that applies runtime accent must also watch `document.querySelector("header")` with `attributeFilter: ["data-header-accent"]`. Without this, `connectedCallback` reads the previous page's accent and never self-corrects.
- **Custom Elements must implement `disconnectedCallback`.** Both `observer` and `headerObserver` must be disconnected and nulled. Failure leaks observers across navigations.
- **Use sentinel `data-*` attributes for querySelector scoping.** Use `data-*` attributes (e.g., `data-post-nav`, `data-toc-summary`) to scope `querySelectorAll` to this component's elements — never rely on structural CSS selectors or DOM position.
- **Lean types only.** Use only the `Accent` fields you actually apply (`light`, `dark`, `gradientLight`, `gradientDark`). Do not import or use fields not referenced in the component.

## Color Reference

| Accent | Light hex | Dark hex | Gradient light | Gradient dark |
|---|---|---|---|---|
| cyan | `#00FFFF` | `#00BFBF` | `rgba(0,255,255,0.18)` | `rgba(0,191,191,0.28)` |
| magenta | `#FF00FF` | `#BF00BF` | `rgba(255,0,255,0.18)` | `rgba(191,0,191,0.28)` |
| yellow | `#FFFF00` | `#BFBF00` | `rgba(255,255,0,0.18)` | `rgba(191,191,0,0.28)` |

Light mode: full-saturation hex, 18% opacity gradient. Dark mode: 75%-brightness hex, 28% opacity gradient.

## Output

This skill produces:

1. Updated (or new) `src/components/{{ v_component_name }}.astro` — correct `<script>` block importing `getHeaderAccent` from `@lib/accents`, with the canonical observer shape
2. `{{ v_sentinel_attr }}` attribute added to the target element in the template (standard variant)
3. No new files — the skill modifies an existing component

## Framework Compliance

- ✅ **Traceability** — source of truth (`@lib/accents`), observer targets, and lifecycle event are all explicit and searchable
- ✅ **Security** — no credentials; no inline script secrets
- ✅ **Simplicity** — one import, one apply function, two event bindings (three for `transition:persist`)
- ✅ **Idempotency** — `applyAccent()` is a pure read-then-set; safe to call multiple times
- ✅ **Artifact Minimalism** — modifies one component file; no new files unless the component itself is new

## Related Standards

- `STANDARDS.md` § "Astro Runtime Accent Theming (Site-Specific)"
- `STANDARDS.md` § "Astro Custom Element (Web Component) Pattern (Site-Specific)"
- `STANDARDS.md` § "Astro `transition:persist` Listener Management (Site-Specific)"

## Known Exceptions

Two permanent, narrow exceptions to the "never re-declare ACCENTS inline" rule are accepted and documented:

**Exception 1 — `is:inline` script blocks (e.g., `PageFind.astro`):**
Astro `<script is:inline>` blocks cannot use ES module imports. Components that require `is:inline` (necessary for third-party integrations that must access the DOM before Astro's module graph resolves) must declare a minimal local accent table — only the fields they actually use (e.g., `{ light, dark }` without gradient values). Document the constraint with a `// NOTE: is:inline prevents ES module imports` comment. This is an accepted, narrow exception — do not use it as precedent for other `<script>` blocks.

**Exception 2 — SSR build-time Tailwind class selection (e.g., `ArrowCard.astro`):**
Components that select an accent at build time via Tailwind class names (e.g., using `index % 3` to pick a CSS class from an array during SSR) cannot use `getHeaderAccent()` — the DOM does not exist during SSR. These components may maintain a local accent array scoped to the Astro frontmatter (`---` block) for build-time class selection only. The gradient `rgba` values in such arrays will duplicate `ACCENTS` — this is accepted, known debt. Runtime gradient application (post-hydration) must still import from `@lib/accents`.
