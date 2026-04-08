# Agent Evolution Log

This file tracks the "Institutional Memory" of the Evolution Loop framework. It records successful operations, patterns identified, and skill creation/promotion history.

## Sessions & Journeys (Logical Tasks)

---

### Journey: 2026-04-07 — "Album of the Week" Feature + Homepage Two-Column Layout

**Goal:** Add an "Album of the Week" sidebar widget to the homepage showing the top Last.fm album of the last 7 days (build-time fetch), a `/listening` detail page, and a desktop two-column homepage layout. Resolves GitHub issue #9.

**Commits:** `53eea80` (feature), `cdf4106` (cleanup)
**Branch:** `feature/album-of-the-week`

**Steps:**

1. Tested Last.fm (`user.getTopAlbums`, `period=7day`), iTunes search, and Odesli APIs to confirm response shapes and chain viability.
2. Created `src/lib/lastfm.ts` — build-time fetch: Last.fm → iTunes → Apple Music URL → Odesli, with module-level singleton cache, typed return, full null-safety, Bandcamp search fallback, and `chartUrl` derived from `LASTFM_USERNAME`.
3. Created `src/components/NowListening.astro` — sidebar widget: full-width album art, title + artist below, links to `/listening`.
4. Created `src/pages/listening.astro` — detail page with album art, title, artist, Last.fm link, Odesli/Bandcamp link, weekly chart link. Uses `BackToPrevious` component.
5. Reworked `src/pages/index.astro` — desktop two-column layout (`lg:grid-cols-[1fr_280px]`), sidebar hosts widget, all section pills wired to header accent via `data-accent-pill` + runtime JS.
6. Added `.env` (gitignored) and `.env.example`.
7. Fixed `Link.astro` to add `rel="noopener noreferrer"` on all external links (site-wide).
8. **Audit fixes (post-@REFLECTOR):** `<aside>` → `<div>` semantic fix on main column; `aria-hidden="true"` on decorative SVGs; `parseInt(...) || 0`; `imageUrl: string | null`; fixed typo "occassionally".
9. **Cleanup (post-@CURATOR):** Removed dead `playcount` field from `LastFmAlbum` type; moved chart URL construction into `lastfm.ts` as `chartUrl` field.

**Audit Result:** @REFLECTOR — Pass (8 items raised in initial pass, all resolved; final pass clean).

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendations:**

- **Pattern:** REPEATING (2x) — `lastfm.ts` is second instance of build-time API lib shape (first: `accents.ts`). Incubator threshold met.
- **Skill Candidate:** `astro-buildtime-api-lib` (Incubator). Promote to Candidate when a 3rd build-time API integration is added (e.g., GitHub activity, Goodreads).
- **Standards Updated:** "Build-Time API Integrations (`src/lib/*.ts`)" section added to STANDARDS.md — singleton cache shape, env var guard, error handling, graceful degradation, multi-source link fallback, external link `rel` enforcement, lean typed return types, no hardcoded user-specific URLs in templates.

---

### Journey: 2026-04-07 — Fix Finding 1: Replace `DOMContentLoaded` + `astro:after-swap` with `astro:page-load` in `Head.astro`

**Goal:** Correct Astro lifecycle event misuse in `Head.astro` (Finding 1 of 9-finding audit). `DOMContentLoaded` fires only on hard load; `astro:page-load` fires on hard load and after every View Transitions client-side navigation.

**Steps:**

1. Replaced two event listeners (`DOMContentLoaded` + `astro:after-swap`) with a single `astro:page-load` listener in `Head.astro`.
2. Created `cypress/e2e/view-transitions-init.cy.ts` with 4 tests verifying `init()` re-runs after client-side navigations (`.show` class present, active theme button present, multiple route directions, multiple page types).

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern:** REPEATING (2x) — second manual fix of Astro lifecycle event misuse (prior: `Header.astro` accent color). Threshold met.
- **Skill Candidate:** YES — `cypress-view-transitions-check` (Incubator). The "visit → client-side nav → assert behavior" Cypress pattern is now confirmed in 2 journeys and will recur with Finding 7 and any future lifecycle fixes. Parameterizable: `{{ v_page_a }}`, `{{ v_page_b }}`, `{{ v_nav_link_text }}`, `{{ v_assertion }}`.
- **Existing Candidate Unblocked:** Finding 9 (extract shared `ACCENTS` to `src/lib/accents.ts`) is the 2nd manual iteration for `astro-runtime-accent-theming`. Draft incubator spec after Finding 9 is @REFLECTOR-approved.
- **Standards Updated:** Added "Cypress Testing — View Transitions" section to STANDARDS.md covering: when to write, standard pattern, assertion targets, file naming, and nav link selectors.

---

### Journey: 2026-04-07 — Fix series card accent color on blog post pages

**Goal:** The "See the rest of the series" `ArrowCard` on `/blog/[...slug]` always rendered in cyan regardless of the page's randomized runtime accent (cyan/magenta/yellow).

**Steps:**

1. Diagnosed root cause: `ArrowCard` uses a build-time `index % 3` accent; when rendered in isolation on a post page (index=0), it always resolves to cyan.
2. Added `<div data-series-card>` sentinel wrapper around `<ArrowCard entry={seriesEntry} />` in `[...slug].astro`.
3. Added `applySeriesCardAccent()` to the existing `<script>` block — reads `data-header-accent`, derives current accent, stamps `data-accent-override="true"` on the card's `<a>`, and applies correct `borderLeftColor` + gradient.
4. Updated `ArrowCard.astro`'s `applyCardGradients` querySelector to `:not([data-accent-override])` to prevent the two scripts from conflicting.

**Audit Result:** @REFLECTOR — Pass (fix is targeted, non-breaking, follows established component conventions)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern:** REPEATING (3x+) / SYSTEMIC — identical `ACCENTS` table + `getHeaderAccent()` + `MutationObserver` + `astro:page-load` listener duplicated across 5 components (`TableOfContents`, `BackToTop`, `BackToPrevious`, `PostNavigation`, `[...slug]`).
- **Skill Candidate:** YES — `astro-runtime-accent-theming` (Incubator). Not yet 2 manual task iterations, but pattern is fully documented and the debt is clear.
- **Standards Updated:** Added "Astro Runtime Accent Theming" section to STANDARDS.md covering: source of truth, no inline duplication rule, standard script structure, sentinel attributes, third-party component guard pattern, and canonical color/opacity values.

---

### Journey: 2026-04-07 — Fix Findings 2 & 6: Migrate `series` field to `reference("series")` + update all consumers

**Goal:** Replace `z.string()` with `reference("series")` in `config.ts` and update all 4 consumers from raw string comparison to typed reference access (`?.slug`).

**Steps:**

1. Added `reference` import to `config.ts`; changed `series: z.string().optional()` → `series: reference("series").optional()`.
2. Updated `blog/[...slug].astro`: added `getEntry` import; replaced manual `getCollection("series").find(s => s.slug === …)` with `await getEntry(post.data.series)`.
3. Updated `series/[slug].astro`: changed filter from `p.data.series === slug` → `p.data.series?.slug === slug`.
4. Updated `series/les-miserables.astro`: same string-compare → `?.slug` fix.
5. Updated `series/[slug]/rss.xml.js`: same string-compare → `?.slug` fix.

**Key Observation:** Schema migration had wider blast radius than expected — 3 additional consumers beyond the primary bug site. Existing Cypress test suite caught all 3 regressions, validating test coverage on series page and RSS feed paths.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern:** NEW — first instance of Astro content collection `reference()` field migration. Blast-radius discovery (multiple consumers of a schema field) is a sub-pattern worth capturing.
- **Skill Candidate:** NO (1x) — single iteration; does not yet meet the 2x threshold. Log for recognition on next schema-field type migration.
- **Standards Updated:** YES — added "Astro Content Collection Schema" section to STANDARDS.md covering: `reference()` over `z.string()` for cross-collection links, `getEntry()` over manual `getCollection+find`, blast-radius audit checklist for schema migrations, and `?.slug` access pattern.

---

### Journey: 2026-04-07 — Fix Findings 3, 4, 5: Data-flow / performance improvements in static page generation

**Goal:** Fix three audit findings — all related to data derivation and prop-passing in Astro's static generation layer.

**Steps:**

1. **Finding 3 — `series/index.astro`:** Derived series sort order via a Map of most-recent post date per series slug. Series with no posts sort last. Pure build-time derivation; no new fetches.
2. **Finding 4 — `series/[slug].astro`:** Removed redundant `getCollection("series").find(…)` in the component body. `seriesEntry` was already available as an `Astro.props` value passed from `getStaticPaths`; replaced the re-fetch with a direct props destructure.
3. **Finding 5 — `blog/[...slug].astro`:** Moved prev/next post computation into `getStaticPaths` using index arithmetic on the already-fetched sorted posts array. Removed a second `getCollection` call and two O(n) loop functions (`getPrevPost`, `getNextPost`) from the component body.

**Key Observation:** Findings 4 and 5 are two independent instances of the same anti-pattern: component body re-fetches or re-computes data that `getStaticPaths` already owns and should pass as props. This pattern is now confirmed at 2 sites and meets the incubator threshold.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern (Findings 4 & 5):** REPEATING (2x) — "component body re-fetches data owned by `getStaticPaths`". Threshold met. Logging as incubator candidate.
- **Skill Candidate:** YES — `astro-getstaticpaths-prop-audit` (Incubator). Playbook: grep pages for `getStaticPaths` + out-of-scope `getCollection`/`getEntry` → verify overlap with props → move computation inside + pass via props → build + Cypress check.
- **Pattern (Finding 3):** NEW (1x) — Map-based derived sort at build time. One-off; does not meet threshold. Watch for recurrence.
- **Standards Updated:** YES — added `getStaticPaths` data-fetching boundary rule to "Astro Content Collection Schema" section of STANDARDS.md.
- **Follow-up (non-blocking):** `(seriesEntry.data as any).order` cast in `[slug].astro` flagged by @REFLECTOR for future cleanup. Not blocking; log as known debt.

---

### Journey: 2026-04-07 — Fix Finding 9: Extract shared ACCENTS table to `src/lib/accents.ts`

**Goal:** Eliminate the duplicated `ACCENTS` lookup table and `getHeaderAccent()` helper that were independently declared inside the `<script>` block of 5+ Astro components. Centralize into a single canonical module importable via `@lib/accents`.

**Steps:**

1. Created `src/lib/accents.ts` — exported `Accent` type, `ACCENTS: Record<string, Accent>`, and `getHeaderAccent()` helper with JSDoc and fallback-to-cyan logic.
2. Updated 5 Astro `<script>` blocks (`TableOfContents`, `BackToTop`, `BackToPrevious`, `PostNavigation`, `[...slug].astro`) to replace inline table declarations with `import { getHeaderAccent } from "@lib/accents"`.
3. Left `PageFind.astro` inline — it uses `is:inline` (required by the pagefind third-party integration), which blocks ES module imports. Documented the constraint with a `// NOTE:` comment and kept a minimal local table covering only `{ light, dark }`.
4. Left `ArrowCard.astro` inline — its accent array is SSR/build-time (Tailwind class selection via `index % 3`); `getHeaderAccent()` cannot run during SSR. Gradient `rgba` values technically duplicate `ACCENTS` — accepted as known debt; noted in STANDARDS.md.
5. All 39 Cypress tests pass; build clean.

**Key Observations:**
- Two distinct and permanent exception classes were discovered and documented: `is:inline` (third-party script constraint) and SSR build-time accent selection (Tailwind class generation). Both are narrow, well-understood, and now captured in STANDARDS.md — they do not erode the canonical-module rule.
- This was the 3rd manual iteration of accent theming work (prior: `Header.astro` fix, series card accent fix), completing the incubator threshold for `astro-runtime-accent-theming`.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern:** REPEATING (3x+) / SYSTEMIC — `astro-runtime-accent-theming` now has 3 @REFLECTOR-approved Journeys. Candidate promoted from "unblocked" to **CANDIDATE** status. Playbook spec should be drafted.
- **Skill Candidate:** YES — `astro-runtime-accent-theming` (Candidate). Playbook steps: (1) grep for inline `ACCENTS` / accent array declarations in `<script>` blocks; (2) verify `is:inline` and SSR-build-time exceptions per STANDARDS.md; (3) replace non-excepted inline declarations with `import { getHeaderAccent } from "@lib/accents"`; (4) run full Cypress suite + build check.
- **Follow-on (non-blocking):** `ArrowCard.astro` SSR gradient values duplicate `ACCENTS` rgba entries. Future work: extract a separate SSR-safe `ACCENT_CLASSES` array (Tailwind class names only) into `accents.ts`, plus a separate gradient-only export; update `ArrowCard.astro` frontmatter to import the Tailwind-class array. Not blocking current state.
- **Standards Updated:** YES — updated "Astro Runtime Accent Theming" section in STANDARDS.md: removed stale "known debt" caveat from no-inline-duplication rule (debt is now paid for 5 components); added `is:inline` exception rule with documentation requirement; added SSR build-time exception rule with accepted-debt framing.

---

---

### Journey: 2026-04-07 — Fix Finding 7: Encapsulate BackToTop as Custom Element

**Goal:** Rewrite `BackToTop.astro` as a `<back-to-top-button>` Custom Element to give it self-contained lifecycle management — removing external `getElementById` wiring from `Head.astro` and making MutationObserver teardown explicit and leak-proof.

**Steps:**

1. Rewrote `BackToTop.astro`: replaced plain `<button id="back-to-top">` with `<back-to-top-button>` CE. `connectedCallback` wires click handler, calls `applyAccent()`, starts `observer` (dark mode) and `headerObserver` (header accent re-roll). `disconnectedCallback` disconnects and nulls both observers.
2. `applyAccent()` reads from `@lib/accents` (established by Finding 9) — no inline table.
3. Updated `global.css`: `html #back-to-top` / `html.scrolled #back-to-top` → `html back-to-top-button` / `html.scrolled back-to-top-button`.
4. Removed `getElementById("back-to-top").onclick` wiring and the now-dead `scrollToTop()` function from `Head.astro`.
5. REFLECTOR flagged missing `headerObserver` — added it watching `header[data-header-accent]` so CE re-applies accent after View Transition navigation (matching `PageFind.astro` pattern).
6. 39/39 Cypress tests pass; build clean.

**Key Observations:**
- The `headerObserver` gap (caught by REFLECTOR) is now the 2nd instance of the dual-MutationObserver shape across two independent components (`PageFind.astro` and `BackToTop.astro`). Meets incubator threshold.
- This is the 3rd Cypress View Transitions lifecycle finding (after Finding 1 and the Header accent fix), crossing the Candidate threshold for `cypress-view-transitions-check`.
- Custom Element pattern is NEW (1x) — watch for recurrence if `BackToPrevious` or `PostNavigation` is refactored similarly.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern A (Cypress View Transitions):** REPEATING (3x) — `cypress-view-transitions-check` **promoted from Incubator to CANDIDATE**. Three separate @REFLECTOR-approved Journeys confirm the pattern. Playbook: visit pageA → click nav link → assert behavior survives (no `cy.reload()`). Parameterize: `{{ v_page_a }}`, `{{ v_page_b }}`, `{{ v_nav_link_text }}`, `{{ v_assertion }}`.
- **Pattern B (Dual-MutationObserver):** REPEATING (2x) — new incubator entry `astro-dual-observer-accent-lifecycle`. Both instances are within the same audit session; needs 1 more cross-Journey instance before Candidate.
- **Pattern C (Custom Element lifecycle):** NEW (1x) — watch. No skill action yet.
- **Standards Updated:** YES — two additions to STANDARDS.md: (1) "Dual-observer requirement for `transition:persist` components" addendum to "Astro Runtime Accent Theming"; (2) new "Astro Custom Element (Web Component) Pattern" section covering lifecycle methods, observer field discipline, CSS selector migration, and external script wiring removal.

---

### Journey: 2026-04-07 — npm audit fix: patch transitive CVEs, bump astro to 4.16.19

**Goal:** Reduce npm vulnerability count from 20 to the minimum achievable without breaking changes (no `--force`).

**Steps:**
1. Ran `npm audit fix` twice until stable — 8 packages added, 9 removed, 61 changed in `package-lock.json`. `package.json` direct dependency ranges unchanged.
2. Key patches: `fast-xml-parser` (critical→patched), `devalue`, `cross-spawn`, `glob`, `minimatch`, `picomatch`, `lodash`, `mdast-util-to-hast`, `prismjs`, `js-yaml`, `brace-expansion`, `diff`, `esbuild`/`vite`. `astro` bumped `4.16.8` → `4.16.19` (patch).
3. 244-page build clean, 39/39 Cypress tests pass.

**Remaining vulnerabilities (9 — accepted/deferred):**
- `astro <=5.18.0` (high): XSS/CSRF/middleware CVEs — **not exploitable** on this static site (no SSR, no middleware, no server islands). Fix requires Astro 6 (`--force`).
- `esbuild`/`vite` (moderate): Dev-server proxy — dev tooling only, not in production.
- `fast-xml-parser` (moderate, one CVE): Via `@astrojs/rss` — fix requires Astro 5+ ecosystem. RSS parsing is build-time, read-only, no user input.
- `yaml`/`yaml-language-server` (moderate): Editor/IDE tooling chain (`@astrojs/check`) — not in production build graph.

**Follow-on (non-blocking):** When Astro 5/6 migration is undertaken, re-run `npm audit fix` to clear remaining 9.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR

**Evolution Recommendation:** None — standard maintenance operation, no new patterns.

---

### Journey: 2026-04-07 — Remove unused imports and declarations (ts(6133) cleanup)

**Goal:** Eliminate 3 ts(6133) warnings that were the only actionable diagnostics remaining after the nine-finding audit.

**Steps:**
1. `src/pages/index.astro`: removed unused `import type { CollectionEntry }` line.
2. `src/pages/series/index.astro`: removed `type CollectionEntry` from import (only `getCollection` is used).
3. `src/pages/series/[slug].astro`: dropped `headings` from `const { Content, headings } = await seriesEntry.render()` — `headings` was not used in the template.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR

**Evolution Recommendation:** None — single-instance cleanup, no recurring pattern. No STANDARDS.md updates needed.

---

## Session-Level Observations — 2026-04-07 Nine-Finding Audit (Complete)

All 9 findings from the audit are now @REFLECTOR-approved. Cross-session patterns:

1. **Lifecycle event misuse is systemic, not isolated.** Findings 1, 7, and the Header accent fix are three independent manifestations of the same root failure: components assumed `DOMContentLoaded` or one-time wiring would survive View Transitions. The fix pattern (`astro:page-load` + dual-MutationObserver) is now fully standardized.

2. **The accent theming debt was the largest single debt cluster.** Five components (TableOfContents, BackToTop, BackToPrevious, PostNavigation, slug page) all independently duplicated the same ACCENTS table. Finding 9 resolved the duplication; Finding 7 resolved the lifecycle leak. These were correctly treated as separate Journeys — both now complete.

3. **Schema changes have non-obvious blast radius.** Findings 2 and 6 showed that a single `config.ts` field type change silently broke 3 additional consumers. The blast-radius audit checklist added to STANDARDS.md is the direct mitigation.

4. **Two skills are now at Candidate.** `astro-runtime-accent-theming` (3x, Finding 9) and `cypress-view-transitions-check` (3x, Finding 7). Both have well-defined playbooks and should be drafted as formal skill specs before the next audit cycle.

5. **Two patterns are in Incubator.** `astro-getstaticpaths-prop-audit` (2x, Findings 4+5) and `astro-dual-observer-accent-lifecycle` (2x, PageFind + BackToTop). Both need one more cross-Journey instance before Candidate.

6. **`(as any)` debt was cleared as a follow-up** (not a finding), confirming REFLECTOR's non-blocking flag process works correctly as a lightweight debt tracker.

---

---

### Journey: 2026-04-07 — Full Prettier Setup (formatting enforcement from scratch)

**Goal:** Establish Prettier as the enforced formatter for the Astro blog — covering pre-commit automation (husky + lint-staged), npm scripts, CI resilience, and a baseline format pass over all existing source files.

**Steps:**

1. Created `.prettierignore` with standard Astro exclusions: `dist/`, `node_modules/`, `.astro/`, `public/pagefind/`, `.vercel/`.
2. Added `format` (`prettier --write .`) and `format:check` (`prettier --check .`) scripts to `package.json`.
3. Installed `husky@^9` and `lint-staged` as devDependencies.
4. Initialized husky via `npx husky init`; wrote `.husky/pre-commit` to invoke `npx lint-staged`.
5. Added `"lint-staged"` config to `package.json`: glob `*.{astro,ts,tsx,js,mjs,css,md,mdx}` → `prettier --write`.
6. Ran `prettier --write .` to bring all existing source files to baseline.
7. Discovered `src/pages/series/les-miserables.astro` fails Prettier's JSX parser (deeply nested conditional JSX — valid Astro, not valid JSX). Resolution: added it to `.prettierignore` with explanatory comment. Template was not rewritten.
8. Added `HUSKY: "0"` env var to CI `npm ci` step (official husky v9 skip signal).
9. Verified: `format:check` exits 0, build produces 244 pages, 39/39 Cypress tests pass.

**Key Decisions:**
- `mdx` must be in the lint-staged glob alongside `md` — easy to miss, silently skips MDX files.
- lint-staged config belongs in `package.json`, not a separate `.lintstagedrc`.
- Parser-incompatible files → `.prettierignore` with comment is the correct pattern (not template rewrite, not Prettier downgrade).
- `HUSKY: "0"` in CI is safer than `--ignore-scripts` (which has broader side effects).

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern:** NEW (1x) — first Prettier/pre-commit enforcement Journey for this project. The 9-step sequence is well-documented, fully verified, and contains non-obvious decision points (mdx glob, CI env var, parser-exception handling) that make it high-value to capture now.
- **Skill Candidate:** YES — `prettier-precommit-setup` (Incubator). Does not yet meet the 2x repetition threshold, but the sequence is mature, complete, and highly parameterizable. Spec now; promote to Candidate on first repeat across another project.
  - Proposed parameters: `{{ v_ci_step_name }}`, `{{ v_lint_staged_glob }}`, `{{ v_prettierignore_extras }}`
  - Proposed playbook: (1) install prettier + plugins; (2) write `.prettierignore`; (3) add `format`/`format:check` scripts; (4) install husky + lint-staged; (5) init husky pre-commit; (6) add lint-staged config to `package.json`; (7) run `prettier --write .`; (8) handle parser exceptions with `.prettierignore` + comment; (9) add `HUSKY: "0"` to CI; (10) verify triple gate (format:check + build + Cypress).
- **Standards Updated:** YES — added new "Code Formatting & Pre-commit Enforcement (Astro Projects)" section to STANDARDS.md covering: plugin order, mdx glob requirement, lint-staged config location, husky v9 CI pattern, `.prettierignore` required exclusions, parser incompatibility handling, `format`/`format:check` script convention, and the triple verification gate.

---

### Journey: 2026-04-07 — Cypress Test Suite Improvements (Audit + Expansion)

**Goal:** Audit an existing 9-spec Cypress e2e suite, fix loose or structurally-coupled assertions, and expand coverage to three previously untested routes (404, series index, tags).

**Steps:**

1. **New spec — `404.cy.ts` (5 tests):** Used `cy.visit(url, { failOnStatusCode: false })` pattern to intentionally hit non-existent routes and assert 404 UI: heading content, home link existence, home link navigation, header presence, and footer theme buttons.
2. **New spec — `series-index.cy.ts` (7 tests):** Covered series listing page — page title, heading, card count, card link format, card with known series name, and aria/semantic structure.
3. **New spec — `tags.cy.ts` (10 tests):** Covered both the tag cloud index (`/tags/`) and a tag detail page (`/tags/dao`) — cloud link count, individual tag link format, detail page heading, post list existence, and post link format.
4. **`homepage.cy.ts` — Theme toggle behavior (4 new tests):** Added: click dark → `data-theme="dark"` + `.dark` class; click light → `data-theme="light"` + no `.dark` class; click system → `data-theme-preference="system"`; active button has `bg-black/5` class, others do not.
5. **`blog-list.cy.ts` — Year grouping fix:** Replaced "at least one post link exists" assertion with explicit `div.font-semibold` year text assertion — tests the actual grouping output, not a proxy.
6. **`blog-post.cy.ts` — Post nav fix:** Replaced loose "any blog link visible" with `cy.get("a[data-post-nav='next']")` — scoped to sentinel attribute, not structural position.
7. **`series-les-miserables.cy.ts` — Intro card fix:** Scoped intro card assertion to `section.les-miserables` with explicit `href` check — not just link text existence.
8. **`cypress/support/e2e.ts` — Exception handler narrowing:** Replaced blanket `return false` exception suppressor with a pattern-matched allowlist of known third-party origins (Vercel analytics, Bluesky). First-party errors now fail tests as intended.

**Verified:** 66/66 tests passing across 9 specs.

**Key Patterns Observed:**

- **`data-*` attribute test contracts:** `cy.get("a[data-post-nav='next']")` — sentinel attributes as stable test hooks. Already in STANDARDS.md as a theming/scoping pattern; this journey confirms the same principle applies directly in Cypress specs.
- **`{ failOnStatusCode: false }` for error pages:** Standard pattern for intentionally testing 404/error routes. Not previously captured in STANDARDS.md Cypress section.
- **Scoping to named CSS sections:** `section.les-miserables`, `.font-semibold` year divs — prefer named structural landmarks over generic DOM traversal or link-existence proxies.
- **Theme toggle test shape:** click button → assert `data-theme` attr on `<html>` → assert class presence/absence. Reusable 3-assertion pattern.
- **Exception handler narrowing:** Pattern-matched allowlist over blanket `return false`. First-party errors should remain visible.

**Audit Result:** @REFLECTOR — Pass (66/66 tests green)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern A — `{ failOnStatusCode: false }` for error page testing:** NEW (1x). Well-defined, parameterizable, clearly distinct from happy-path tests. Watch for recurrence (e.g., testing auth-gated routes, custom error pages). Log for Candidate on 2nd instance.
- **Pattern B — Theme toggle assertion shape:** REPEATING (2x) — `view-transitions-init.cy.ts` already asserts "exactly one active theme button" post-navigation; `homepage.cy.ts` now asserts button click → `data-theme` attr + class. Two distinct assertions of the same underlying toggle contract. Meets Incubator threshold.
- **Pattern C — Exception handler narrowing (pattern-match allowlist):** NEW (1x). Correct engineering practice but single instance. No skill action yet; capture as standard.
- **Pattern D — `data-*` sentinel attributes as Cypress selectors:** REPEATING (3x+) / SYSTEMIC — `data-post-nav`, `data-series-card`, `data-header-accent` all used as test hooks or scoping anchors across multiple specs and multiple journeys. This pattern is now well-established and should be documented explicitly in the Cypress STANDARDS section (currently only documented in the theming section).
- **Skill Candidate:** NO for the overall Journey (broad audit, not a repeating sequence end-to-end). Sub-patterns B and D are the actionable signals.
- **Standards Updated:** YES — see below.

---

### Journey: 2026-04-07 — Add `format:check` to CI workflow

**Goal:** Wire `npm run format:check` into `.github/workflows/e2e.yml` as a server-side enforcement gate, ensuring formatting is validated in CI even if a developer bypasses the local pre-commit hook.

**Steps:**

1. Added a `Check formatting` step (`run: npm run format:check`) to `e2e.yml` between the existing "Install dependencies" and "Build site" steps.

**Context:** This was the third and final piece of a 3-part session: (1) Full Prettier setup (EVOLUTION_LOG entry above), (2) Cypress test suite expansion (39 → 66 tests), (3) this CI enforcement step. All three are @REFLECTOR-approved.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern:** VARIANT — this step closes the `prettier-precommit-setup` Incubator playbook. It is Step 9/10 of that already-documented sequence, not a new independent pattern. No new skill candidacy.
- **Skill Candidate:** NO — too narrow in isolation; correctly captured as the final step of `prettier-precommit-setup`. That Incubator entry is now marked fully exercised in production CI (GitHub Actions, ubuntu-latest, Node 20).
- **Incubator Update:** `prettier-precommit-setup` playbook confirmed end-to-end in a real GitHub Actions workflow. The canonical step sequence (`npm ci` with `HUSKY: "0"` → `format:check` → `build` → Cypress) is now production-verified.
- **Standards Updated:** YES — added "CI step ordering" bullet to the "Code Formatting & Pre-commit Enforcement" section of STANDARDS.md, specifying that `format:check` must run immediately after `npm ci` and before `npm run build`, with the canonical four-step sequence documented.

---

### Journey: 2026-04-07 — Menu Refactor (Header.astro full rewrite)

**Goal:** Replace a minimal 2-link nav (`blog / rss` with slash separators) with a full navigation system: desktop nav with a series dropdown, mobile hamburger menu with inline series expansion, ARIA disclosure widget pattern, and correct `transition:persist` lifecycle management.

**Steps:**

1. Rewrote `src/components/Header.astro`: desktop nav (blog · series dropdown · tags · rss), mobile hamburger + vertical nav, search button always visible outside hamburger scope.
2. Series dropdown: build-time `getCollection("series")` filtered to active and sorted alphabetically; click-to-reveal with chevron rotation; closes on outside-click or Escape.
3. ARIA: `aria-expanded` + `aria-controls` disclosure pattern on both desktop dropdown button and mobile hamburger button. Explicitly avoided `role="menu"` / `role="menuitem"` (those require a full keyboard nav contract).
4. Applied `AbortController` pattern at module scope: `controller.abort()` at top of `initHeader()` tears down all listeners atomically; fresh `controller = new AbortController()` issues a new `{ signal }` passed to every `addEventListener` call. Eliminates both button-level and document-level accumulation.
5. Used `astro:page-load` (not `astro:after-swap`) as the re-initialization trigger — correct event for `transition:persist` elements.
6. UI state reset on each page transition: `closeMobileMenu()` and `closeDropdown()` called at the top of `initHeader()` so menus never persist open across navigations.
7. Created `cypress/e2e/navigation.cy.ts` (17 tests); narrowed 1 assertion in `cypress/e2e/homepage.cy.ts`.
8. 83/83 Cypress tests pass; build clean.

**Key Technical Patterns Discovered/Applied:**

- **AbortController for `transition:persist` elements:** Module-scope controller + `abort()` at init top + `{ signal }` on every `addEventListener`. Idiomatic, atomic, zero named-handler bookkeeping. Non-obvious pattern that solves Astro-specific listener accumulation.
- **`astro:page-load` vs `astro:after-swap`:** `astro:page-load` is the correct event for re-initializing `transition:persist` elements (confirmed again — now 3rd instance).
- **Build-time `getCollection()` in Header:** Safe and idiomatic in Astro SSG; runs once at build, produces static HTML.
- **ARIA disclosure widget pattern:** `aria-expanded` + `aria-controls` on trigger button; no `role="menu"` (requires full keyboard nav contract).

**Audit Result:** @REFLECTOR — Pass (83/83 tests)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern A — AbortController for `transition:persist` elements:** NEW (1x) — first explicit, standalone application of this pattern as the primary listener-management strategy. Prior Journeys used `astro:page-load` but with named handler removal, not `AbortController`. Meets Incubator threshold at 2x. Log for recognition; promote to Incubator candidate on next `transition:persist` component that wires multiple listeners.
- **Pattern B — `astro:page-load` for `transition:persist` re-init:** REPEATING (3x+) / SYSTEMIC — confirmed in Finding 1 (`Head.astro`), Header accent fix, and now this Journey. Fully captured in STANDARDS.md; no new action needed.
- **Pattern C — ARIA disclosure widget (no `role="menu"`):** NEW (1x) — first explicit ARIA pattern decision captured. Non-obvious (many devs default to `role="menu"`). Capture in STANDARDS.md; promote to Incubator on 2nd interactive widget Journey.
- **Pattern D — Build-time `getCollection()` in layout/header components:** NEW (1x) — straightforward but worth noting as an approved pattern for static sites. No skill action; capture in STANDARDS.md Astro section.
- **Skill Candidate — `astro-persist-nav-component`:** NO (1x) — hamburger + dropdown is a complete, high-quality pattern but this is the first instance. Log for Incubator on second navigation component build.
- **Standards Updated:** YES — see below (AbortController pattern, ARIA disclosure, build-time `getCollection()` in headers).

---

### Journey: 2026-04-07 — "Now Listening" Feature (Last.fm build-time widget)

**Goal:** Add a sidebar widget and detail page showing the user's most-listened album in the last 7 days, sourced from the Last.fm API at build time.

**Steps:**

1. Created `src/lib/lastfm.ts`: exported `LastFmAlbum` type, private `_fetchTopAlbum()`, module-level singleton promise cache (`_cache ??= _fetchTopAlbum()`), and public `getTopAlbum()` accessor. Includes env var guard (warn + null), full try/catch, Odesli URL resolution, and Bandcamp search fallback URL.
2. Created `src/components/NowListening.astro`: sidebar widget receiving `LastFmAlbum | null` as a prop; renders album art, name, artist, play count, links to `/listening`; explicit "Nothing scrobbled yet" empty state.
3. Created `src/pages/listening.astro`: detail page calling `getTopAlbum()` in frontmatter; renders album art, artist, play count, Last.fm link, and Odesli/Bandcamp fallback link; explicit empty state.
4. Updated `src/pages/index.astro`: reworked to two-column desktop layout (`lg:grid-cols-[1fr_280px]`) with `NowListening` in the sidebar; single-column on mobile unchanged.
5. Applied `rel="noopener noreferrer"` to `src/components/Link.astro` for external links (security fix discovered during audit).
6. Added `.env.example` documenting `LASTFM_API_KEY` and `LASTFM_USERNAME`.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern A — `src/lib/*.ts` build-time API utility with singleton cache:** REPEATING (2x) — `lastfm.ts` is the second instance of this shape (first: `accents.ts`). Meets Incubator threshold. Skill candidate: **`astro-buildtime-api-lib`** (Incubator). Shape: typed return type → env var guard → try/catch → module-level `_cache ??= _fetch()` → exported accessor → null returns throughout → consumer renders explicit empty state. Promote to Candidate on 3rd instance (next build-time API integration).
- **Pattern B — Multi-source link fallback (primary → search fallback):** NEW (1x) — first instance of the Odesli → Bandcamp search fallback pattern. Encode fallback URL at fetch time, not in template. Watch for recurrence (e.g., music → Spotify → Bandcamp; books → OpenLibrary → Amazon).
- **Pattern C — Two-column sidebar layout:** NEW (1x) — `lg:grid-cols-[1fr_280px]` for homepage sidebar. Single instance; no skill action.
- **Standards Updated:** YES — added new "Build-Time API Integrations (`src/lib/*.ts`)" section to STANDARDS.md covering: singleton cache shape, env var guard, error handling, null-safety, graceful degradation/empty state, multi-source link fallback, and `rel="noopener noreferrer"` for external links. @CURATOR pass also added two new rules: "Lean typed return types" (remove dead fields) and "No hardcoded user-specific URLs in templates" (derive from env var).
- **Known Debt (non-blocking, @REFLECTOR-flagged):** ~~CLOSED by subsequent Journey (see below)~~
  - ~~`playcount` field on `LastFmAlbum` type — removed in Odesli expansion Journey.~~
  - ~~Hardcoded Bandcamp URL in template — moved to `lastfm.ts` `bandcampFallbackUrl` in Odesli expansion Journey.~~

---

### Journey: 2026-04-07 — Most Recent Read Feature (Open Library enrichment)

**Goal:** Add a "Most Recent Read" sidebar widget and `/reading` detail page. Book data lives in a static JSON file (`src/data/current-reading.json`) enriched at build time with cover art and an Open Library URL — no auth, no API key. Mirrors the `NowListening` widget architecture established by the Last.fm Journey.

**Commit:** `05542bd`
**Branch:** `feature/album-of-the-week`

**Steps:**

1. Created `src/data/current-reading.json` — canonical source-of-truth for the current book: `title`, `author`, `isbn`, `rating`, `tags`, and `storygraph` metadata with strict TypeScript-compatible enums (`PlotOrCharacter`, `YesNoComplicated`).
2. Created `src/lib/reading.ts` — build-time lib: reads JSON, fetches book cover via ISBN from Open Library Covers API (`-L.jpg`), searches Open Library for the book's page URL, module-level singleton cache (`_cache ??= _fetchCurrentBook()`). Intentionally omits env var guard (Open Library is a public API — no key required; see STANDARDS.md exception note).
3. Created `src/components/NowReading.astro` — sidebar widget, mirrors `NowListening.astro` shape exactly: accent-pill heading, cover image, title + author, arrow-on-hover chevron, explicit empty state ("Nothing on the nightstand yet.").
4. Created `src/pages/reading.astro` — detail page: cover image, star rating (full/half/empty SVG), tags as rounded pills, Open Library link, StoryGraph metadata table with human-readable labels.
5. Updated `src/pages/index.astro` — wired `NowReading` widget below `NowListening` in the sidebar with `pb-6` padding separator.

**Reflector Findings (all resolved before approval):**
- ✅ Added `console.error("[reading] Failed to fetch Open Library data:", err)` to catch block.
- ✅ Simplified `isbn` extraction: `bookData.isbn ?? null` (removes needless conditional).
- ✅ Added comment about Open Library blank GIF quirk — unknown ISBNs return a 1×1 transparent GIF, not a 404; `coverUrl` will be non-null even when no cover exists.

**Audit Result:** @REFLECTOR — Pass

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendations:**

- **Pattern A — `src/lib/*.ts` build-time API lib:** REPEATING (3x) — `reading.ts` is the **third** instance of this shape (`accents.ts` → `lastfm.ts` → `reading.ts`). Candidate threshold crossed. `astro-buildtime-api-lib` promoted from Incubator to **CANDIDATE** in the Candidate Patterns table.
- **Pattern B — `src/data/*.json` static source-of-truth enriched at build time:** NEW (1x) — first explicit instance of the pattern where a developer-maintained JSON file is the authoritative data store and a `src/lib/*.ts` utility enriches it with remote API data at build time. Watch for recurrence (e.g., `current-project.json`, `current-track.json`). No skill action yet; codified in STANDARDS.md.
- **Pattern C — Public API exception to env var guard:** NEW (codified) — `reading.ts` intentionally omits the env var guard because Open Library requires no authentication. This is a valid, narrow exception to the `src/lib/*.ts` env var guard standard. Documented in STANDARDS.md as an explicit exception clause.
- **Known Debt:** No Cypress coverage for `/reading` route. The `NowReading` widget and detail page are not exercised by any e2e spec. Non-blocking — consistent with `/listening` which also has no dedicated spec — but should be addressed when Cypress coverage is next expanded.
- **Standards Updated:** YES — (1) added public API exception clause to "Build-Time API Integrations" env var guard rule; (2) added "Static data file as source-of-truth" rule to "Build-Time API Integrations" section.

---

### Journey: 2026-04-07 — Album of the Week: Odesli Grouped Platform Links

**Goal:** Expand the Odesli integration in `lastfm.ts` from returning a single `odesliUrl: string | null` to a fully structured `StreamingLinks` envelope — grouped Listen and Buy platform arrays, an aggregator URL, and a Bandcamp search fallback. Resolves all known debt from the prior "Now Listening" Journey. Branch: `feature/album-of-the-week`.

**Commits:** `b43f5af` (Odesli expansion), remediation amend (Bandcamp URL moved to `lastfm.ts`)

**Steps:**

1. Defined `StreamingLink` and `StreamingLinks` types at the top of `lastfm.ts`. `StreamingLinks` shape: `{ listen: StreamingLink[]; buy: StreamingLink[]; odesliUrl: string | null; bandcampFallbackUrl: string }`.
2. Added module-scope `LISTEN_PLATFORMS` and `BUY_PLATFORMS` ordered arrays (key → display name) — priority-ordered by expected user relevance.
3. Replaced `fetchOdesliUrl()` (returned `string | null`) with `fetchOdesliLinks(appleMusicUrl, bandcampFallbackUrl)` (returns `StreamingLinks`). Uses `flatMap` to conditionally include only platforms present in the Odesli response.
4. Updated `LastFmAlbum` type: replaced flat `odesliUrl` + `bandcampSearchUrl` fields with `streaming: StreamingLinks`.
5. Moved `bandcampFallbackUrl` construction to `_fetchTopAlbum()` — computed once, passed into `fetchOdesliLinks()`. Template no longer constructs any URLs.
6. Updated `listening.astro`: renders grouped Listen and Buy sections (conditional on non-empty arrays); "All platforms" Odesli link when available; Bandcamp fallback only when all platform groups and aggregator are absent. Reads `album.streaming.bandcampFallbackUrl`.
7. **Debt closed — `playcount`:** Field removed from `LastFmAlbum` type and from `_fetchTopAlbum()` return (it was populated but never rendered).
8. **Debt closed — hardcoded Bandcamp URL in template:** Bandcamp URL now constructed exclusively in `lastfm.ts` and surfaced via `streaming.bandcampFallbackUrl`.

**Audit Result:** @REFLECTOR — Pass (one STANDARDS.md violation caught during session: Bandcamp URL initially in template; moved to `lastfm.ts` in same session before final approval).

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendation:**

- **Pattern A — Grouped platform classification with ordered priority maps:** REPEATING (2x) — first standalone articulation of this sub-pattern (prior Journey had a single flat `odesliUrl`; this Journey formalized it). The `LISTEN_PLATFORMS`/`BUY_PLATFORMS` module-scope constant array shape + `flatMap` idiom is now documented in STANDARDS.md. Promotes the "Multi-source link fallback" Candidate table entry from NEW (1x) to REPEATING (2x) / refined.
- **Pattern B — Streaming link envelope type over flat optional fields:** NEW (codified) — `StreamingLinks` as a stable envelope (arrays always present, possibly empty) avoids optional-field proliferation on the parent type. Documented in STANDARDS.md "Build-Time API Integrations" section.
- **Pattern C — `flatMap` for sparse API presence:** Idiomatic TypeScript for conditionally building typed arrays from an API record with optional keys. No new skill action; captured as part of the platform classification standard above.
- **Skill Candidacy — `astro-buildtime-api-lib`:** Still Incubator (2x). This Journey strengthens and refines the existing pattern but does not add a third independent API integration. Promote to Candidate when a third `src/lib/*.ts` integration is created (e.g., GitHub activity, Goodreads, OpenLibrary).
- **Known Debt:** None. All prior debt from the "Now Listening" Journey is resolved.
- **Standards Updated:** YES — updated "Build-Time API Integrations" section in STANDARDS.md: added "Grouped platform classification with ordered priority maps" and "Streaming link envelope type" rules.

---

---

### Journey: 2026-04-07 — Cypress e2e Coverage: Most Recent Read Feature

**Goal:** Add comprehensive, resilient Cypress e2e tests for the "Most Recent Read" feature — homepage sidebar widget + `/reading` detail page. Tests must not hard-code specific book data.

**Files changed:**
- `cypress/e2e/reading.cy.ts` — new spec (25 tests across 4 describe blocks)
- `src/pages/reading.astro` — minor: StoryGraph section heading now links to StoryGraph profile; `data-star-rating` sentinel attribute added to star container

**@REFLECTOR findings (all resolved before approval):**
1. `cy.viewport("macbook-15")` moved to `beforeEach` in the homepage widget describe block.
2. `data-star-rating` sentinel added to `reading.astro` star container; test updated to `cy.get("[data-star-rating]").find("svg").should("have.length", 5)` — replacing a fragile `aria-label` string match.
3. `rel` assertion strengthened to `.should("have.attr", "rel", "noopener noreferrer")` (exact value, not substring).

**All 108 tests passing.**

**Key Patterns Observed:**

- **`data-*` sentinel for dynamic-content containers:** `data-star-rating` is a new sub-instance of the established `data-*` sentinel pattern. The distinction: here the sentinel scopes a *count* assertion on *child* elements whose content varies with real data. Prior instances (`data-post-nav`, `data-series-card`) scoped structural navigation. Same principle, new application.
- **Behavior-based / data-agnostic test authoring:** Tests use regex to assert format (`/\d+(\.\d+)?\s*\/\s*5/`), `have.length.greaterThan` to assert presence without hard-coding counts, element-type checks (`find("h2, div")`) for semantic structure, and class-substring filters (`filter("[class*='rounded-full']")`) for styling. Specific book title, author, rating value, and tag content are deliberately not asserted.

**Audit Result:** @REFLECTOR — Pass (all @REFLECTOR items resolved)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendations:**

- **Pattern A — `data-*` sentinel for dynamic-content containers:** REPEATING (SYSTEMIC, new sub-pattern) — `data-star-rating` is documented as the first instance of the "sentinel-for-child-count" sub-use. Existing STANDARDS.md `data-*` rule extended with a sub-bullet covering this case. Candidate Patterns table entry updated.
- **Pattern B — Behavior-based / data-agnostic test authoring:** REPEATING (2x) — first explicit articulation, but the prior Cypress expansion Journey also refactored away hard-coded assertions (year grouping, blog post nav). Meets the implicit 2x threshold. New STANDARDS.md Cypress rule added.
- **Patterns 2–4 (astro-buildtime-api-lib, cypress-view-transitions-check, prettier-precommit-setup):** No new instances this Journey. No action.
- **Skill Candidate:** NO for the overall Journey (feature-specific spec, not a repeating end-to-end sequence).
- **Standards Updated:** YES — (1) `data-*` sentinel rule in STANDARDS.md extended with dynamic-content-container sub-pattern; (2) new "Behavior-based assertions over data-specific values" rule added to the Cypress General Conventions section.

---

### Journey: 2026-04-07 — Draft and Certify `cypress-view-transitions-check` Skill

**Goal:** Convert the `cypress-view-transitions-check` CANDIDATE pattern into a production-ready, @REFLECTOR-approved `SKILL.md` at `.opencode/skills/cypress-view-transitions-check/SKILL.md`.

**Source instances:**
- `cypress/e2e/view-transitions-init.cy.ts` — 4 tests written during "Fix Finding 1" Journey (primary instance)
- Header accent lifecycle fix — test proving accent survives client-side navigation
- BackToTop dual-observer fix — verified by pre-existing suite (no new test written; documented as exception)

**Steps:**

1. Drafted `SKILL.md` from the two written instances, with the pre-existing-coverage case documented as a Known Exception.
2. Submitted to @REFLECTOR. First audit raised 2 issues: 1 blocking (Step 3 reverse-direction template used `find(a[href=...])` form without explaining the homepage-logo exception; inconsistent with `.contains()` rule); 1 non-blocking (third instance mischaracterized as pattern-application; `Known Exceptions: None` inaccurate).
3. Resolved both issues: added conditional guidance for homepage vs. non-homepage reverse nav selectors; updated third instance to characterize it as passive coverage; replaced `None.` with a documented exception requiring revert-and-observe confirmation.
4. @REFLECTOR second audit: Pass. One non-blocking latent inconsistency noted (Step 3 equality URL check vs. Step 2 include check for non-homepage `{{ v_page_a }}`); not blocking.
5. Skill file written to `.opencode/skills/cypress-view-transitions-check/SKILL.md`.

**Audit Result:** @REFLECTOR — Pass (second audit, all 2 first-audit issues resolved; 1 latent non-blocking observation noted for future maintenance)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendations:**

- **Pattern (skill drafting lifecycle):** REPEATING (3x) — third formal CANDIDATE → SKILL.md drafting + audit cycle. Threshold met. The recurring first-audit cluster (template-body hardcoding, nonexistent syntax, exception handling gaps) is now a stable pattern. Log `skill-drafting` as Incubator candidate.
- **Follow-up (non-blocking):** Step 3 URL assertion uses `eq` vs. `include` inconsistency. Note for next maintenance pass on the skill.

---

### Journey: 2026-04-07 — Draft and Certify `astro-runtime-accent-theming` Skill

**Goal:** Convert the `astro-runtime-accent-theming` CANDIDATE pattern into a production-ready, @REFLECTOR-approved `SKILL.md` at `.opencode/skills/astro-runtime-accent-theming/SKILL.md`.

**Source instances:**
- `TableOfContents.astro` — standard script variant, sentinel-scoped querySelectorAll
- `PostNavigation.astro` — standard script variant, directional gradient application
- `BackToPrevious.astro` — standard script variant
- `BackToTop.astro` — Custom Element variant (dual-observer, transition:persist)
- `[...slug].astro` series-card accent fix — third-party component conflict pattern (data-accent-override)

**Steps:**

1. Drafted `SKILL.md` from the five confirmed source instances.
2. Submitted to @REFLECTOR. First audit raised 3 issues: 1 blocking (standard template body hardcoded wrong CSS property names, contradicting `{{ v_accent_properties }}` parameter intent); 2 non-blocking (CE template used nonexistent `| kebab-case` pipe filter; CE `connectedCallback` missing event-handler wiring placeholder per STANDARDS.md contract).
3. Resolved all 3 issues in a single revision pass: replaced hardcoded CSS with placeholder + `TableOfContents.astro` reference block; introduced `{{ v_ce_tag_name }}` parameter; added event-handler wiring comment to `connectedCallback`.
4. @REFLECTOR second audit: Pass. No further issues.
5. Skill file written to `.opencode/skills/astro-runtime-accent-theming/SKILL.md`.

**Audit Result:** @REFLECTOR — Pass (second audit, all 3 first-audit issues resolved)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendations:**

- **Pattern (skill drafting lifecycle):** REPEATING (2x) — second formal CANDIDATE → SKILL.md drafting + audit cycle. Pattern now confirmed: first-audit findings cluster around template body hardcoding (don't pre-fill parameterized code), nonexistent template syntax, and structural omissions (missing STANDARDS.md-required lifecycle ordering). Approaching Candidate threshold for a `skill-drafting` meta-skill.
- **Observation:** The `{{ v_ce_tag_name }}` parameter split (separating PascalCase class name from kebab-case CE tag name) is a structural pattern applicable to any future CE skill. Note for next CE-related skill draft.

---

### Journey: 2026-04-07 — Draft and Certify `astro-buildtime-api-lib` Skill

**Goal:** Convert the `astro-buildtime-api-lib` CANDIDATE pattern into a production-ready, @REFLECTOR-approved `SKILL.md` at `.opencode/skills/astro-buildtime-api-lib/SKILL.md`.

**Source instances:**
- `src/lib/lastfm.ts` — authenticated multi-source API lib (Last.fm → Odesli)
- `src/lib/reading.ts` — public API enrichment of a committed JSON source-of-truth
- `src/lib/accents.ts` — ancestral origin of the typed accessor shape; does not conform to the full playbook (no async fetch, no cache promise, no external API). Documented as a Known Exception in the skill file.

**Steps:**

1. Drafted `SKILL.md` from the two confirmed source instances (`lastfm.ts`, `reading.ts`) plus the Known Exception clause for `accents.ts`.
2. Submitted to @REFLECTOR. First audit raised 6 issues: 1 blocking (JSON Sub-case A return type was incorrectly documented as `T | null`; must be `T`), 5 non-blocking (missing `prerequisites` section, missing `rules-for-the-agent` on singleton mandate, env var guard exception not codified in playbook, multi-source fallback section not referencing STANDARDS.md, `framework-compliance` table incomplete).
3. Resolved all 6 issues in a single revision pass.
4. @REFLECTOR second audit: Pass. No further issues.
5. Skill file written to `.opencode/skills/astro-buildtime-api-lib/SKILL.md`.

**Audit Result:** @REFLECTOR — Pass (second audit, all 6 first-audit issues resolved)

**Agents Involved:** Engineer → @REFLECTOR → @CURATOR

**Evolution Recommendations:**

- **Pattern (skill drafting lifecycle):** NEW (1x) — first formal CANDIDATE → SKILL.md drafting + audit cycle. The 5-step sequence (draft → first audit → resolve findings → second audit → certify) is now documented. No skill action yet (2x threshold not met); log for Candidate if a second skill is drafted.
- **Structural Observation (for SKILL_TEMPLATE.md):** The first-audit findings reveal gaps in `SKILL_TEMPLATE.md` that caused non-blocking issues in the draft: (1) the template has no `Prerequisites` section in the frontmatter area — only in "How It Works"; (2) the template has no `Rules & Constraints` section (mandatory rules that @REFLECTOR enforces); (3) the template has no `Known Exceptions` section. All three were needed in `astro-buildtime-api-lib/SKILL.md`. See SKILL_TEMPLATE.md update recommendation below.
- **Skill Candidate — `astro-runtime-accent-theming`:** Next draft candidate. Higher value than `cypress-view-transitions-check` — see Q3 below.
- **Standards Updated:** No new STANDARDS.md changes required from this Journey. The skill file's `Related Standards` section correctly cross-references existing entries.

---

## Candidate Patterns

| Pattern                                    | Classification      | Skill Candidate                              | Status                                                                                                                                  |
| ------------------------------------------ | ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Astro runtime accent theming               | REPEATING (3x+) / SYSTEMIC | `astro-runtime-accent-theming`        | **CERTIFIED** — `SKILL.md` at `.opencode/skills/astro-runtime-accent-theming/SKILL.md`. @REFLECTOR-approved (2-pass audit; 3 issues raised and resolved). Source instances: `TableOfContents.astro`, `PostNavigation.astro`, `BackToPrevious.astro`, `BackToTop.astro` (CE variant), `[...slug].astro` series-card fix. Two permanent exceptions: `is:inline` and SSR build-time Tailwind class selection. |
| Cypress View Transitions behavior check    | REPEATING (3x)      | `cypress-view-transitions-check`             | **CERTIFIED** — `SKILL.md` at `.opencode/skills/cypress-view-transitions-check/SKILL.md`. @REFLECTOR-approved (2-pass audit; 2 issues raised and resolved). Source instances: `view-transitions-init.cy.ts` (4 tests) + header accent fix. BackToTop dual-observer fix documented as pre-existing-coverage Known Exception. |
| Dual-MutationObserver (dark mode + header accent) | REPEATING (2x) | `astro-dual-observer-accent-lifecycle`  | Incubator — 2 instances (`PageFind.astro`, `BackToTop.astro`); both in same audit session; needs 1 more @REFLECTOR-approved instance in a separate Journey before Candidate |
| Astro Custom Element lifecycle             | NEW (1x)            | —                                            | Watch — `BackToTop.astro` is first CE rewrite; promote to candidate if a second component is converted (e.g., `BackToPrevious`, `PostNavigation`) |
| Astro content collection `reference()` migration | NEW (1x)      | —                                            | Watch — promote to candidate on 2nd schema-field type migration                                                                         |
| `getStaticPaths` prop-passing anti-pattern | REPEATING (2x)      | `astro-getstaticpaths-prop-audit`            | Incubator — 2 sites confirmed (Findings 4 & 5, same Journey); needs 1 more @REFLECTOR-approved instance across a separate Journey before Candidate promotion |
| Map-based derived sort (build-time)        | NEW (1x)            | —                                            | Watch — promote to candidate on 2nd instance                                                                                            |
| Multi-source link fallback + grouped platform classification (Odesli pattern) | REPEATING (2x) / refined | —                          | Incubator — original instance: flat `odesliUrl` fallback in "Now Listening" Journey. Refined instance: grouped `LISTEN_PLATFORMS`/`BUY_PLATFORMS` arrays + `StreamingLinks` envelope in "Odesli Grouped Platform Links" Journey. `flatMap` idiom + envelope type documented in STANDARDS.md. Promote to Candidate on next integration using multi-category platform resolution (e.g., books: read-online vs buy). |
| Build-time API utility in `src/lib/*.ts` (singleton cache + null-safe) | REPEATING (3x) | `astro-buildtime-api-lib` | **CERTIFIED** — `SKILL.md` at `.opencode/skills/astro-buildtime-api-lib/SKILL.md`. @REFLECTOR-approved (2-pass audit; 6 issues raised and resolved). Source instances: `lastfm.ts` + `reading.ts`. `accents.ts` documented as Known Exception (no external API, no cache promise). |
| Prettier + husky + lint-staged setup       | NEW (1x)            | `prettier-precommit-setup`                   | Incubator — 10-step sequence fully documented and production-verified (GitHub Actions, ubuntu-latest, Node 20); canonical CI step order confirmed; promote to Candidate on 2nd project instance |
| Theme toggle assertion shape (click → `data-theme` attr + class) | REPEATING (2x) | —                          | Incubator — 2 instances (`view-transitions-init.cy.ts` active-button check, `homepage.cy.ts` full toggle assertions); parameterizable as `{{ v_button_id }}`, `{{ v_expected_attr }}`, `{{ v_expected_class }}` |
| `cy.visit({ failOnStatusCode: false })` for error page testing | NEW (1x) | —                            | Watch — first instance in `404.cy.ts`; promote to Candidate on 2nd instance (e.g., auth-gated route, custom error page)                |
| `data-*` sentinel attributes as Cypress selectors | REPEATING (3x+) / SYSTEMIC | —                         | Systemic — `data-post-nav`, `data-series-card`, `data-header-accent`, `data-star-rating` used across 4+ specs and 4+ Journeys. `data-star-rating` (Most Recent Read Journey) is first instance of the sentinel-for-dynamic-content-container sub-pattern: sentinel added to a container whose *children* vary with real data, scoping count/structure assertions without coupling to specific values. Sub-pattern documented as an extension of the existing STANDARDS.md `data-*` rule. No new skill needed. |
| Exception handler pattern-match allowlist  | NEW (1x)            | —                                            | Watch — correct practice, single instance in `cypress/support/e2e.ts`; capture as standard, promote to Candidate if replicated on another project |
| AbortController for `transition:persist` multi-listener components | NEW (1x) | `astro-persist-nav-component`   | Watch — first standalone application in `Header.astro` (5 listeners across button + document). Promote to Incubator on 2nd `transition:persist` component with multiple listeners. |
| ARIA disclosure widget (no `role="menu"`)  | NEW (1x)            | —                                            | Watch — first explicit ARIA pattern decision captured. Capture in STANDARDS.md; promote to Incubator on 2nd interactive widget Journey. |
| Build-time `getCollection()` in layout/header components | NEW (1x) | —                              | Watch — approved pattern for Astro SSG headers. Captured in STANDARDS.md; no skill action until recurrence. |

## Promotion History

| Date | Skill | From → To | Audit Passes | Notes |
|---|---|---|---|---|
| 2026-04-07 | `astro-buildtime-api-lib` | CANDIDATE → CERTIFIED | 2 (@REFLECTOR) | 6 issues raised in first audit (1 blocking: JSON Sub-case A return type); all resolved. Source instances: `lastfm.ts`, `reading.ts`. `accents.ts` documented as Known Exception. |
| 2026-04-07 | `astro-runtime-accent-theming` | CANDIDATE → CERTIFIED | 2 (@REFLECTOR) | 3 issues raised in first audit (1 blocking: template hardcoded wrong CSS properties; 2 non-blocking: pipe filter syntax, missing connectedCallback lifecycle ordering); all resolved. Source instances: 5 components (standard + CE variants). Two permanent exceptions documented. |
| 2026-04-07 | `cypress-view-transitions-check` | CANDIDATE → CERTIFIED | 2 (@REFLECTOR) | 2 issues raised in first audit (1 blocking: reverse-direction selector inconsistency + missing homepage-logo exception; 1 non-blocking: third instance mischaracterized; Known Exceptions inaccurate); all resolved. Known Exception documented: pre-existing coverage with revert-and-observe gate. |
