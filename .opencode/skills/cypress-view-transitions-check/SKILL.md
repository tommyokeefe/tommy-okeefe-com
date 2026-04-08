---
name: cypress-view-transitions-check
description: Playbook for writing a Cypress test that verifies a behavior survives Astro View Transitions client-side navigation. Uses the visit → click nav link → assert pattern. Covers header nav links, in-page content links, and multi-route direction testing.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: cypress
---

# cypress-view-transitions-check

Write a Cypress test that proves a fixed behavior survives Astro View Transitions client-side navigation — not just hard load.

## Purpose

Astro View Transitions keep the `<header>` persistent across navigations and swap only the `<main>` content via a client-side route change. Behaviors wired to `DOMContentLoaded` (fires only on hard load) silently break after client-side navigation. Behaviors wired to `astro:page-load` (fires on hard load AND after every View Transition) work correctly.

This skill provides the canonical Cypress pattern for proving that a fixed lifecycle behavior survives client-side navigation: visit page A → click a nav link → assert the behavior is present on page B. No `cy.reload()` — that is a hard load and does not exercise View Transitions.

Derived from three @REFLECTOR-approved instances:
- `cypress/e2e/view-transitions-init.cy.ts` — 4 tests proving `init()` re-runs after navigation (`.show` class, active theme button, multiple route directions, multiple page types)
- Header accent lifecycle fix — Cypress test proving accent re-applies after navigation
- BackToTop dual-observer fix — verified by the *pre-existing* `view-transitions-init.cy.ts` suite (no new test written; existing `.animate` class tests provided coverage for the fixed behavior)

## When to Use

Load this skill when the task is:
- Fixing a lifecycle event bug (`DOMContentLoaded` → `astro:page-load`, missing `astro:after-swap`, etc.)
- Adding a new `astro:page-load` listener or MutationObserver that needs proof it survives navigation
- Writing a regression test for any behavior that must re-initialize after a client-side navigation

## Prerequisites

- Cypress is installed and configured (`cypress.config.ts` + `cypress/e2e/` directory exist)
- The behavior under test is observable in the DOM (a class, attribute, style, or element presence)
- At least one stable navigation path exists (header nav link to a page that also renders the behavior)

## Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `{{ v_spec_file }}` | string | yes | Target spec file path relative to project root (e.g., `cypress/e2e/view-transitions-init.cy.ts`). Append to an existing file if the behavior is part of the same init function; create a new file if the subject is standalone. |
| `{{ v_describe_label }}` | string | yes | Outer `describe` label (e.g., `"View Transitions — BackToTop accent survives navigation"`) |
| `{{ v_page_a }}` | string | yes | Starting page path for `cy.visit()` (e.g., `"/"`, `"/blog"`) |
| `{{ v_page_b }}` | string | yes | Destination page path asserted after navigation (e.g., `"/blog"`, `"/blog/"`) |
| `{{ v_nav_selector }}` | string | yes | Cypress selector for the nav link that triggers the client-side navigation. Use `cy.get("header").contains("a", "blog")` for header nav; `cy.get("main a[href^='/prefix/']").first()` for in-page links. |
| `{{ v_assertion }}` | string | yes | The assertion that proves the behavior survived. Describe in plain English (e.g., `cy.get(".animate").each($el => cy.wrap($el).should("have.class", "show"))`). |
| `{{ v_it_label }}` | string | yes | Inner `it` label (e.g., `"adds .show to .animate elements after navigating to blog list"`) |

## Example Usage

Proving that `init()` re-runs after navigating from homepage to blog list:

| Parameter | Value |
|---|---|
| `{{ v_spec_file }}` | `cypress/e2e/view-transitions-init.cy.ts` |
| `{{ v_describe_label }}` | `"View Transitions — init() re-executes after navigation"` |
| `{{ v_page_a }}` | `"/"` |
| `{{ v_page_b }}` | `"/blog"` |
| `{{ v_nav_selector }}` | `cy.get("header").contains("a", "blog")` |
| `{{ v_assertion }}` | `cy.get(".animate").each($el => cy.wrap($el).should("have.class", "show"))` |
| `{{ v_it_label }}` | `"adds .show to .animate elements after navigating from homepage to blog list"` |

**Produces:**
- Test appended to (or written in) `cypress/e2e/view-transitions-init.cy.ts`

## Playbook

### Step 1 — Decide: new file or append to existing

- **Append** to `cypress/e2e/view-transitions-init.cy.ts` if the assertion is about the shared `init()` function behavior (`.show` class, theme button state).
- **Create new file** named `cypress/e2e/<subject>-view-transitions.cy.ts` if the behavior under test is specific to a single component or fix (e.g., `back-to-top-view-transitions.cy.ts`).

### Step 2 — Write the single-direction test

The canonical shape:

```ts
describe("{{ v_describe_label }}", () => {
  it("{{ v_it_label }}", () => {
    cy.visit("{{ v_page_a }}");

    // Navigate client-side — do NOT use cy.reload()
    {{ v_nav_selector }}.click();
    cy.url().should("include", "{{ v_page_b }}");

    // Assert the behavior survived
    {{ v_assertion }};
  });
});
```

### Step 3 — Add the reverse-direction test (recommended)

Proving the behavior in one direction is a necessary condition; proving it in both directions rules out a one-time initialization bug.

**Selector choice for reverse navigation depends on the destination:**

- **Navigating back to `/` (homepage):** Use `cy.get("header").find("a[href='/']").first()` — the home link is the site logo and `.contains()` cannot match it reliably by text.
- **Navigating back to any other page:** Use `cy.get("header").contains("a", "<label>")` — matching the forward-direction selector convention from STANDARDS.md.

```ts
it("{{ v_it_label }} (reverse: {{ v_page_b }} → {{ v_page_a }})", () => {
  cy.visit("{{ v_page_b }}");

  // Use find(a[href='/']) for homepage; contains("a", label) for all other pages.
  // Example for homepage: cy.get("header").find("a[href='/']").first().click();
  // Example for /blog: cy.get("header").contains("a", "blog").click();
  cy.get("header").find("a[href='{{ v_page_a }}']").first().click();  // adjust selector per above

  cy.url().should("eq", Cypress.config("baseUrl") + "{{ v_page_a }}");
  {{ v_assertion }};
});
```

Skip this step if the behavior only exists on the destination page (e.g., a blog-post-only component — no reverse assertion is possible from a list page).

### Step 4 — Add a cross-page-type test (recommended)

Navigating between top-level routes is not sufficient alone. Add a test that navigates to a page of a different type (e.g., from a list page to a detail page):

```ts
it("{{ v_it_label }} (cross-type: to detail page)", () => {
  cy.visit("{{ v_page_a }}");

  // Navigate to a detail page via an in-page link
  cy.get("main a[href^='/prefix/']").first().click();
  cy.url().should("include", "/prefix/");

  {{ v_assertion }};
});
```

Adapt the `href` prefix to the project's URL structure (e.g., `/blog/`, `/series/`).

### Step 5 — Run the spec

```sh
npx cypress run --spec "{{ v_spec_file }}"
```

All tests must pass. If any test fails:
- Confirm the behavior under test is actually wired to `astro:page-load` (not `DOMContentLoaded`).
- Confirm the nav link selector is correct: use `cy.get("header").contains("a", "<label>")` for header links.
- Do not use `cy.reload()` or `cy.visit(pageB)` directly — these are hard loads and will give false passes.

Then run the full suite to check for regressions:

```sh
npx cypress run
```

## Rules & Constraints

All of these are enforced by @REFLECTOR:

- **Never use `cy.reload()` in View Transitions tests.** `cy.reload()` is a full page reload — it does not exercise the View Transitions swap. A test that reloads will produce a false positive.
- **Never use `cy.visit(pageB)` to simulate navigation.** Directly visiting the destination page is also a hard load. The navigation must happen via a `.click()` on a nav link inside the running page.
- **Always assert the URL after clicking.** Confirm you are on the expected page before asserting the behavior: `cy.url().should("include", "{{ v_page_b }}")`. Without this, a failed navigation would let the assertion run on the wrong page.
- **Cover at least two navigation directions.** A behavior that only works one-way is not fully proven. Always include at least one reverse-direction or cross-type test unless structurally impossible.
- **Use `cy.get("header").contains("a", label)` for header nav links.** Do not use `cy.get("a[href='...']")` globally — it may match links in the `<main>` content. Scoping to `header` ensures the click triggers the header nav, not an incidental link.
- **Assert visible, stable DOM artifacts.** Prefer class presence (`.show`), attribute values (`data-theme`), or element count over computed styles or internal state variables. Computed styles are not reliable in Cypress without `invoke("css", ...)` and add test brittleness.
- **No hard-coded content values.** Do not assert specific post titles, dates, or counts that will change as content changes. Use structural assertions: `have.length.greaterThan(0)`, `have.class`, `have.attr`.

## Output

This skill produces one or more `it()` blocks added to:
- An existing spec file (append), or
- A new `cypress/e2e/<subject>-view-transitions.cy.ts` file

Minimum output: one `it()` for the primary direction. Recommended: two or three `it()` blocks covering reverse direction and cross-page-type navigation.

## Framework Compliance

- ✅ **Traceability** — test label names the exact behavior and navigation path under test
- ✅ **Security** — no credentials; test-only code
- ✅ **Simplicity** — three-step pattern: visit → click → assert
- ✅ **Idempotency** — tests are read-only; safe to run multiple times
- ✅ **Artifact Minimalism** — modifies one spec file (or creates one new spec file)

## Related Standards

- `STANDARDS.md` § "Cypress Testing — View Transitions (Site-Specific)"
- `STANDARDS.md` § "Cypress Testing — General Conventions (Site-Specific)"
- `STANDARDS.md` § "Astro `transition:persist` Listener Management (Site-Specific)"`

## Known Exceptions

**Pre-existing test coverage:** If an existing View Transitions test already demonstrably covers the behavior under fix, writing a duplicate test is not required. The canonical example: the BackToTop dual-observer fix was covered by the pre-existing `.animate` class tests in `view-transitions-init.cy.ts`. To confirm eligibility for this exception: revert the fix, run the full Cypress suite, and verify that at least one View Transitions test fails. If no test fails on revert, the exception does not apply — a new test is required.
