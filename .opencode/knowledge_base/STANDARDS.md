# Technical Standards & Best Practices

## Developer Workflow & CLI Scripting

- **Idempotency:** Scripts must be safe to run multiple times. Use "check-then-act" patterns (e.g., `mkdir -p`, `git branch --list`).
- **Templating:** Use `{{ v_variable_name }}` for parameterization to ensure scripts are reusable across different environments.
- **Environment Awareness:** Always verify prerequisites (e.g., check if a CLI tool is installed) before execution.
- **Error Handling:** Use explicit exit codes and pipe errors to `stderr`.

## Skill Documentation

- Every skill must have a `SKILL.md` at `.opencode/skills/<skill-name>/SKILL.md`.
- Documentation must include:
  - Purpose
  - When to Use
  - Prerequisites
  - Input Variables (with `{{ v_variable_name }}` convention)
  - Playbook / Sequence (numbered steps)
  - Rules & Constraints (mandatory rules that @REFLECTOR enforces — never omit)
  - Output description
  - Framework Compliance checklist
  - Related Standards (cross-links to STANDARDS.md sections)
  - Known Exceptions (if any narrow deviations from the playbook are accepted)
- **Reference implementation:** `.opencode/skills/astro-buildtime-api-lib/SKILL.md` — first @REFLECTOR-certified skill for this project. Use it as the canonical structural example when drafting new skills.

## Playbook Skills (Workflow Automation)

- **Definition:** Skills that automate a sequence of steps (a Journey) rather than a single command.
- **Documentation:** Playbook skills must include a `Sequence` section in their `SKILL.md` detailing the logical steps.
- **Decision Gates:** Playbooks should include checkpoints where the agent asks for user confirmation before proceeding with high-impact steps.
- **Net Impact:** Playbook design should focus on the final desired state, ensuring all intermediate cleanup is handled.

## Evolution Loop Implementation

- New patterns are captured in `@EVOLUTION_LOG.md`.
- **Skill Candidate Criteria:**
  - **Repetition:** The task has been performed 2x manually OR appears in documented checklists/runbooks.
  - **Parameterization:** The process can be generalized with `{{ v_variable_name }}` parameters.
  - **High Impact:** The task improves visibility into infrastructure costs, security, dependencies, or reduces time by >30%.
  - **Automation Readiness:** Assessed on 1-5 scale (5=ready, 1=needs more data).
- **Skill Promotion Funnel:**
  1. **Incubator:** Pattern identified + specification drafted
  2. **Candidate:** Design approved and specification drafted
  3. **Implementation:** Active development + unit testing
  4. **Review:** @REFLECTOR audit + integration testing
  5. **Certified:** Promoted to `.opencode/skills/` with SKILL.md
- **Output Artifact Standards:**
  - Skills should produce structured, machine-readable outputs (JSON, CSV, Markdown)
  - All outputs should be versioned/timestamped for auditability
  - Skills should support both **dry-run** and **execute** modes for safety-critical operations
  - Skills should generate human-readable summary reports (Markdown preferred)

## Astro Runtime Accent Theming (Site-Specific)

- **Source of truth:** The page's active accent color is always read from `document.querySelector("header")?.dataset.headerAccent` — never hardcoded or assumed.
- **Canonical module:** All runtime accent data lives in `src/lib/accents.ts` — the `Accent` type, the `ACCENTS` Record, and the `getHeaderAccent()` helper. Import from `@lib/accents` in any standard `<script>` block. Do **not** re-declare inline.
- **`is:inline` exception:** Astro `<script is:inline>` blocks cannot use ES module imports (`@lib/accents` will be unavailable). Components that require `is:inline` (e.g., `PageFind.astro`, which must access the DOM before Astro's module graph resolves) must declare a minimal local accent table — only the fields they actually need (e.g., `{ light, dark }` without gradient values). Document the constraint with a `// NOTE: is:inline prevents ES module imports` comment. This is an accepted, narrow exception — not a general pattern.
- **SSR build-time exception:** Components that select an accent at build time via Tailwind class names (e.g., `ArrowCard.astro` using `index % 3` to pick a CSS class) cannot use `getHeaderAccent()` because the DOM does not exist during SSR. These components may maintain a local accent array scoped to the Astro frontmatter (`---` block) for build-time class selection only. The gradient `rgba` values in such arrays will duplicate `ACCENTS` — this is accepted, known debt. Runtime gradient application (post-hydration) must still read from the canonical source.
- **Standard script structure:** Every accent-aware component `<script>` follows this shape: `apply*Accent()` function → `document.addEventListener("astro:page-load", ...)` → `new MutationObserver(...)` watching `document.documentElement` with `attributeFilter: ["class"]`.
- **Dual-observer requirement for `transition:persist` components:** Any component that (a) applies a runtime accent AND (b) is inside a `transition:persist` element (or is itself `transition:persist`) requires a **second** MutationObserver watching `document.querySelector("header")` with `attributeFilter: ["data-header-accent"]`. Reason: `connectedCallback` (for Custom Elements) or `astro:page-load` fires during the View Transition swap, before `Header.astro` has re-rolled `data-header-accent` for the new page. Without the second observer, the accent reads the *previous* page's value. Both `PageFind.astro` and `BackToTop.astro` use this dual-observer shape.
- **Sentinel attributes:** Use `data-*` attributes on wrapper elements (e.g., `data-series-card`, `data-post-nav`) to scope querySelector calls to the correct elements. Prefer sentinel attributes over relying on structural CSS selectors.
- **Third-party component guard:** When a wrapper applies a runtime accent to an element that a child component also styles (e.g., `ArrowCard`'s `applyCardGradients`), stamp `data-accent-override="true"` on the element from the wrapper's script and guard the child's selector with `:not([data-accent-override])` to prevent style conflicts.
- **Dark mode values:** Light mode uses full-saturation hex (`#00FFFF`, `#FF00FF`, `#FFFF00`); dark mode uses 75%-brightness hex (`#00BFBF`, `#BF00BF`, `#BFBF00`). Gradient opacity: ~18% light (`rgba(...,0.18)` or `2E` hex alpha), ~28% dark (`rgba(...,0.28)` or `47` hex alpha).

## Cypress Testing — General Conventions (Site-Specific)

- **`data-*` sentinel attributes as selectors:** Always prefer `data-*` attributes as Cypress selector hooks over structural CSS selectors or DOM position (e.g., `cy.get("a[data-post-nav='next']")` not `cy.get(".post-nav a:first-child")`). This matches the sentinel-attribute convention used in component scripts and makes tests resilient to markup restructuring. The same `data-*` attributes used for runtime scoping in JS (e.g., `data-series-card`, `data-post-nav`) are the correct targets in specs. When the rendered *content* of a container is dynamic (changes with real data — e.g., a star-rating widget whose SVG count or fill varies), add a `data-*` sentinel to the *container* element in the Astro component (e.g., `data-star-rating`) and scope child assertions to it (e.g., `cy.get("[data-star-rating]").find("svg").should("have.length", 5)`). This keeps the test structurally stable even when the values inside change between content updates.
- **Scoping assertions:** Scope to the narrowest reliable container — named CSS class (`section.les-miserables`), semantic element (`footer`), or `data-*` wrapper — before asserting on children. Avoid traversing from a generic ancestor.
- **Assert the actual output, not a proxy:** Prefer asserting the rendered value (`div.font-semibold` containing year text) over a side-effect proxy (e.g., "at least one post link exists after grouping"). Test what the user actually sees.
- **Behavior-based assertions over data-specific values:** Tests must not hard-code specific content values (book titles, author names, album names, numeric ratings, tag counts) that will change as real data changes. Instead, assert structural behavior: use `.should("have.length.greaterThan", 0)` to confirm presence, regex patterns to assert format without hard-coding a value (e.g., `/\d+(\.\d+)?\s*\/\s*5/` to assert a rating format), element-type checks (`find("h2, div")`) to assert semantic structure, and class-substring filters (`filter("[class*='rounded-full']")`) to assert styling patterns. Reserve exact-value assertions for content that is genuinely invariant (page titles, static heading text, `href` formats derived from known URL patterns).
- **Error pages — `{ failOnStatusCode: false }`:** Use `cy.visit(url, { failOnStatusCode: false })` when intentionally testing routes that return non-2xx status codes (404, custom error pages). Without this flag Cypress will fail the test before any assertion runs.
- **Theme toggle assertion shape:** The canonical pattern for testing theme toggle is: (1) click `#<mode>-theme-button`; (2) assert `cy.get("html").should("have.attr", "data-theme", "<mode>")`; (3) assert class presence/absence (`have.class "dark"` / `not.have.class "dark"`). For active-state: assert clicked button `has.class "bg-black/5"` and siblings `not.have.class "bg-black/5"`.
- **Exception handler — pattern-match allowlist:** `cypress/support/e2e.ts` must NOT use a blanket `return false` in `Cypress.on("uncaught:exception", ...)`. Instead, maintain a named `THIRD_PARTY_ERROR_PATTERNS` array of regexes for known external origins (e.g., Vercel analytics, third-party embeds). Only suppress matched patterns — first-party errors must still fail tests. Add new patterns to the array as new integrations are added; never widen to a blanket suppress.

## Cypress Testing — View Transitions (Site-Specific)

- **When to write this test:** Any Finding that fixes a lifecycle event (`DOMContentLoaded` → `astro:page-load`, `astro:after-swap` misuse, etc.) must be accompanied by a Cypress test that proves the behavior survives a client-side navigation.
- **Standard pattern:** `visit(pageA)` → `click nav link` → `assert URL` → `assert behavior`. Do **not** use `cy.reload()` — that is a hard load and does not exercise View Transitions.
- **Assertion targets:** Prefer visible, stable DOM artifacts of the behavior under test (e.g., presence of `.show` class, exactly one active theme button) over internal implementation details.
- **File naming:** `cypress/e2e/<subject>-view-transitions.cy.ts` or append to an existing `view-transitions-init.cy.ts` if the assertion is about the shared `init()` function.
- **Nav link selector:** Use `cy.get("header").contains("a", label)` for header nav links; use `cy.get("main a[href^='/prefix/']").first()` for in-page content links.

## Astro Content Collection Schema (Site-Specific)

- **Use `reference()` for cross-collection links:** When a content field points to an entry in another collection, always type it as `reference("collectionName")` (not `z.string()`). This gives Astro build-time validation and typed access via `getEntry()`.
- **Use `getEntry()` to resolve references:** After migrating a field to `reference()`, resolve the linked entry with `await getEntry(entry.data.field)`. Never use `getCollection(…).find(s => s.slug === rawString)` for reference resolution — that pattern is fragile and was replaced by this standard.
- **Blast-radius audit on schema migrations:** Before shipping any field type change in `config.ts`, grep all pages and components for usage of the affected field name. Every consumer that previously compared or read the field as a raw string must be updated to use `?.slug` (or the appropriate typed accessor). Do not assume the primary bug site is the only consumer.
- **Reference access pattern:** Access the slug of a resolved reference with `entry.data.field?.slug`. Use optional chaining (`?.`) even on required references, since the field itself may be optional.
- **Test coverage expectation:** Any schema field used in a filtered `getCollection()` call (e.g., series page, RSS feed) must have a Cypress or build-level test. The test is what catches blast-radius regressions automatically.
- **`getStaticPaths` is the single data-fetching boundary:** All `getCollection` and `getEntry` calls for page-level data must live inside `getStaticPaths`, not in the component body. Data needed by the component must be passed via the `props` return value and read from `Astro.props`. A component-body `getCollection` is always a bug: it fires at render time, re-runs redundantly across every route, and can cause O(n) work per page slot. The only valid exception is data that cannot be known until render time and is not route-specific.

## Astro Blog Series Post Scaffolding (Site-Specific)

- **Folder naming convention:** `src/content/blog/{{ v_series_prefix }}-{{ v_post_number }}-{{ v_part }}-{{ v_book }}-{{ v_chapter }}/`
  - `{{ v_series_prefix }}`: 2–3 letter series abbreviation (e.g., `lm` for `les-miserables`)
  - `{{ v_post_number }}`: 3-digit zero-padded sequential counter (e.g., `097`)
  - `{{ v_part }}`, `{{ v_book }}`, `{{ v_chapter }}`: lowercase, hyphenated structural metadata (e.g., `part-2`, `book-3`, `chapter-5`)
  - **Example:** `lm-097-part-2-book-3-chapter-5/`

- **File structure:** Every post is a directory containing an `index.md` file.

- **Frontmatter schema:** Must match `src/content/config.ts` blog collection definition with fields:
  - `title` (string) — post title; can be empty in draft state
  - `description` (string) — single-line summary; can be empty in draft state
  - `date` (date, coerced) — publication date in ISO format (`YYYY-MM-DD`)
  - `draft` (boolean, optional) — `false` for published posts, `true` for drafts
  - `series` (reference to series collection, optional) — slug matching a series directory (e.g., `les-miserables`)
  - `part`, `book`, `chapter` (all strings, optional) — structural metadata for series posts
  - `tags` (array of strings, optional) — content tags; can be empty array
  - `image`, `imageAlt` (optional) — feature image and alt text
  - `blueskyPostUri` (optional) — Bluesky canonical post URI for social sharing

- **Post number auto-detection:** When creating a new post in a series, the next sequential number can be auto-detected by scanning the blog directory for the highest existing `{{ v_series_prefix }}-NNN` prefix and incrementing. This removes the manual bookkeeping step and prevents collisions. Supported by the `astro-blog-series-scaffold` skill.

- **Scaffolding automation:** Use the `astro-blog-series-scaffold` skill (located at `.opencode/skills/astro-blog-series-scaffold/`) to automate folder + file creation. The skill provides a reference Bash implementation (`scaffold.sh`) that:
  - Auto-detects next sequential post number
  - Validates series existence and part/book/chapter format
  - Creates folder with correct naming convention
  - Generates YAML frontmatter template
  - See `.opencode/skills/astro-blog-series-scaffold/SKILL.md` for full playbook and usage.

## Astro Custom Element (Web Component) Pattern (Site-Specific)

- **When to use:** Prefer a Custom Element (`customElements.define`) over a plain `<script>` block when a component needs self-contained lifecycle management — specifically when it must wire and tear down event listeners or MutationObservers tied to its own DOM node. Components that are `transition:persist` and apply runtime styling are strong candidates.
- **Required lifecycle methods:**
  - `connectedCallback`: wire click handlers, call `apply*()` once, start all MutationObservers.
  - `disconnectedCallback`: call `.disconnect()` and null every observer stored as a class field. Failure to do this leaks observers across navigations.
- **Observer fields:** Declare all MutationObserver instances as `private` class fields initialized to `null` (e.g., `private observer: MutationObserver | null = null`). This makes teardown in `disconnectedCallback` explicit and prevents silent reference leaks.
- **Dual-observer requirement:** If the CE applies a runtime accent, it needs both observers: one on `document.documentElement` (`attributeFilter: ["class"]` for dark mode) and one on `document.querySelector("header")` (`attributeFilter: ["data-header-accent"]` for View Transition re-roll). See "Astro Runtime Accent Theming — Dual-observer requirement" above.
- **CSS selector migration:** When converting a component from a plain element to a CE tag, update all CSS selectors that targeted the old element (e.g., `html #back-to-top` → `html back-to-top-button`). Check both component-scoped `<style>` blocks and global CSS files (`global.css`).
- **Script wiring removal:** After converting to a CE, remove any external `getElementById` wiring in `Head.astro` or layout scripts that previously attached click handlers or observers to the element. The CE owns its own behavior.

## Code Formatting & Pre-commit Enforcement (Astro Projects)

- **Prettier plugin order matters:** Always include `prettier-plugin-astro` and `prettier-plugin-tailwindcss` in `devDependencies`. Plugin order in `prettier.config.*` must place `prettier-plugin-astro` before `prettier-plugin-tailwindcss` — reversing them breaks Tailwind class sorting inside `.astro` files.
- **lint-staged glob must include `mdx`:** The staged-files glob must be `*.{astro,ts,tsx,js,mjs,css,md,mdx}`. Omitting `mdx` silently skips formatting of MDX content files — a common oversight.
- **lint-staged config location:** Keep `lint-staged` config in `package.json` (the `"lint-staged"` key). Do not create a separate `.lintstagedrc` — it adds a file without benefit and diverges from project conventions.
- **husky v9 CI pattern:** Add `HUSKY: "0"` as an environment variable to the CI `npm ci` step. The `prepare` script runs `husky` automatically post-install; `HUSKY: "0"` is the official v9 skip signal and prevents spurious CI failures if the `.husky/` directory is not present in the CI workspace. Do not use `--ignore-scripts`.
- **`.prettierignore` required exclusions for Astro:** Always ignore `dist/`, `node_modules/`, `.astro/` (generated types), `public/pagefind/` (pagefind output), and `.vercel/`. Missing `.astro/` causes Prettier to attempt parsing generated type files and fail.
- **Parser incompatibility handling:** When a valid `.astro` file triggers a Prettier parse error (e.g., deeply nested conditional JSX that Prettier's JSX parser cannot handle), the correct resolution is to add the specific file to `.prettierignore` with an explanatory comment — **not** to rewrite the template or downgrade Prettier. Pattern: `# Prettier parser incompatibility (<reason>) \n path/to/file.astro`.
- **`format` and `format:check` scripts:** Add both to `package.json`. `format` (`prettier --write .`) is for local bulk-formatting; `format:check` (`prettier --check .`) is for CI verification. Running `prettier --write .` once on setup is required to bring all existing files to baseline before activating pre-commit enforcement.
- **CI step ordering:** In the CI workflow, `format:check` must run as the **first substantive step after `npm ci`** and before `npm run build`. This ordering is intentional — formatting failures are cheap to detect and should short-circuit the pipeline before a full build is attempted. The canonical step sequence is: `npm ci` (with `HUSKY: "0"`) → `npm run format:check` → `npm run build` → Cypress.
- **Verification gate:** After setup, confirm all three pass before closing the Journey: `format:check` exits 0, `astro build` succeeds, and the full Cypress suite passes. A clean `format:check` that breaks the build indicates a formatter plugin conflict.

## Astro `transition:persist` Listener Management (Site-Specific)

- **Use `AbortController` for multi-listener `transition:persist` components:** When a `transition:persist` element wires more than one `addEventListener` call (including document-level listeners), manage all of them with a single module-scope `AbortController`. At the top of the init function: `controller.abort(); controller = new AbortController(); const { signal } = controller;`. Pass `{ signal }` to every `addEventListener`. This tears down all listeners atomically in one call — no named handler references, no per-button cleanup, no accumulation across page transitions.
- **Why `AbortController` over named handler removal:** `removeEventListener` requires a stable reference to the exact same function object. Closures inside an init function are re-created on each call, making removal impossible without storing references. `AbortController` eliminates the bookkeeping entirely.
- **`astro:page-load` is the correct re-init event:** Register the init function with `document.addEventListener("astro:page-load", initFn)` — not `DOMContentLoaded` (fires only on hard load) and not `astro:after-swap` (fires before the new DOM is ready). `astro:page-load` fires on both hard load and after every View Transitions client-side navigation.
- **Reset UI state at init top:** For menus, dropdowns, and any toggled UI, call close/reset helpers at the top of the init function (before wiring listeners). This ensures menus never persist open across page transitions.
- **Document-level listeners need the signal too:** Outside-click handlers (`document.addEventListener("click", ...)`) and keyboard handlers (`document.addEventListener("keydown", ...)`) accumulate just as button handlers do. Always pass `{ signal }` to document-level listeners in `transition:persist` components.

## Astro Navigation & Interactive Component Patterns (Site-Specific)

- **ARIA disclosure widget — not `role="menu"`:** For click-to-reveal dropdowns and expandable sections, use the ARIA disclosure pattern: `aria-expanded="false/true"` on the trigger button + `aria-controls="<panel-id>"` pointing to the revealed panel. Do **not** use `role="menu"` / `role="menuitem"` — those require a full keyboard navigation contract (arrow keys, Home/End, roving tabindex) that a simple click-to-reveal does not implement. Misusing `role="menu"` creates an accessibility contract you must then fulfill.
- **Build-time `getCollection()` in layout/header components:** Calling `await getCollection("series")` in `Header.astro`'s frontmatter (`---` block) is safe and idiomatic for Astro SSG. It runs once at build time per page, produces static HTML, and has no runtime cost. Filter (e.g., `.filter(s => s.data.active)`) and sort in the frontmatter before passing to the template.
- **Chevron rotation for disclosure state:** Use a Tailwind `rotate-180` class toggled via `classList.toggle("rotate-180", isOpen)` on a chevron SVG. Pair with `transition-transform duration-200` on the SVG for smooth animation. This requires no additional CSS — pure Tailwind utility.
- **Escape key closes all open panels:** In a nav component with multiple toggleable panels (dropdown + mobile menu), a single `keydown` Escape handler that calls all `close*()` helpers is correct. Do not add per-panel Escape listeners.
- **Icon swap for toggle buttons (hamburger/close):** Embed both icons in the button markup; toggle `hidden` class between them. This avoids innerHTML replacement (which would break event delegation) and keeps the DOM stable across transitions.

## Build-Time API Integrations (`src/lib/*.ts`) (Site-Specific)

- **Location:** All build-time API utilities live in `src/lib/<integration>.ts` and are imported in Astro frontmatter (`---` blocks). They must not be called at runtime (no client-side fetch).
- **Typed return + null on failure:** Every integration exports a typed return type (e.g., `export type LastFmAlbum = { ... }`) and returns `T | null`. Return `null` for missing env vars, non-OK responses, missing data, and caught exceptions — never throw.
- **Module-level singleton cache:** Use a module-level promise cache to ensure multiple pages sharing the same build only call the external API once: `let _cache: Promise<T | null> | null = null; export function get(): Promise<T | null> { return (_cache ??= _fetch()); }`. The private `_fetch()` function does the actual work; the exported function is always the cache accessor.
- **Env var guard:** Check for required env vars at the top of `_fetch()`. On missing vars, emit `console.warn("[<lib>] VAR_NAME not set — skipping fetch.")` and return `null`. Do not throw.
- **Error handling:** Wrap the full fetch body in `try/catch`. On caught errors, emit `console.error("[<lib>] Failed to fetch <resource>:", err)` and return `null`.
- **No hardcoded user-specific URLs in templates:** Any URL that incorporates a value already held in an env var (e.g., a Last.fm username in a profile link) must be constructed from the env var, not typed literally. Hardcoded user values silently diverge when the env var changes. Derive and return these URLs from the `src/lib/*.ts` utility (or include the username in the return type) so templates stay env-agnostic.
- **Lean typed return types:** Only include fields on the exported type that are consumed by at least one current caller. Dead fields (populated but never read by any consumer) must be removed or explicitly justified with an inline comment. Unused fields add noise to the API surface and create false impressions of feature coverage.
- **Graceful degradation in consumers:** Components that receive a `T | null` prop must render an explicit empty state when the value is `null`. Never conditionally render "nothing" silently — always show a human-readable fallback (e.g., "Nothing scrobbled yet this week.").
- **Multi-source link fallback:** When linking to an external resource that may not be available on a preferred platform (e.g., Odesli for streaming links), resolve the preferred URL first, then fall back to a search URL on a secondary platform (e.g., Bandcamp search). Encode the fallback search URL at data-fetch time, not in the template. The template should branch on `preferredUrl ? <preferred> : <fallback>`.
- **Grouped platform classification with ordered priority maps:** When an external API returns a flat `linksByPlatform` record (e.g., Odesli), classify platform links into semantic groups (e.g., `listen` vs `buy`) using ordered module-scope constant arrays: `const LISTEN_PLATFORMS: { key: string; name: string }[] = [...]`. Order entries by descending user-relevance priority. Use `flatMap` to filter out absent platforms without creating sparse arrays: `LISTEN_PLATFORMS.flatMap(({ key, name }) => byPlatform[key]?.url ? [{ name, url: byPlatform[key].url }] : [])`. Return the typed arrays on the integration's return type; conditionally render each group in the template only when its array is non-empty.
- **Streaming link envelope type:** When a build-time integration resolves links across multiple platforms and categories, return a dedicated envelope type rather than flat optional fields. Shape: `{ listen: StreamingLink[]; buy: StreamingLink[]; aggregatorUrl: string | null; fallbackUrl: string }`. This keeps the consumer type stable even when individual platforms are absent — arrays are always present (possibly empty), avoiding optional-field proliferation on the parent type.
- **Env var guard exception — public APIs:** The env var guard (`console.warn` + return `null` on missing var) applies only to integrations that require authentication credentials. Build-time libs that call **public, unauthenticated APIs** (e.g., Open Library Covers, Open Library Search) must omit the guard — there is no env var to check. Document the exception with an inline comment: `// No env var guard — Open Library is a public API (no key required).` This is a narrow, explicit exception; any integration that uses an API key must retain the guard.
- **Static data file as source-of-truth (`src/data/*.json`):** When a feature's core data is developer-maintained (not fetched from an authenticated external source), store it in `src/data/<feature>.json` with strict TypeScript-compatible field values. The corresponding `src/lib/<feature>.ts` utility imports the JSON directly and enriches it with remote API data (e.g., cover images, canonical URLs) at build time. The JSON file is the single point of update for content changes; the lib file is the single point of update for API enrichment logic. Consumers import only through the lib, never by importing the JSON directly.
- **External link security:** Any link rendered with `target="_blank"` (including via an `external` prop on `Link.astro`) must include `rel="noopener noreferrer"`. Enforce this in the shared `Link.astro` component, not at individual call sites.

## External System Operations

- **Auditability:** When interacting with external APIs (GitHub, Jira, etc.), always include the specific query, filter, or unique identifier (e.g., query strings, resource IDs, or PR numbers) used in the output summary.
- **Data Mapping:** Map technical status IDs or codes to human-readable labels to ensure reports are accessible to non-technical stakeholders.
