---
name: astro-blog-series-scaffold
description: Playbook for scaffolding a new blog post in a serialized content series. Automates folder creation, sequential numbering, and frontmatter generation for Astro blog collections.
license: MIT
compatibility: opencode
metadata:
  audience: content-authors
  category: astro
---

# astro-blog-series-scaffold

Scaffold a new blog post in any serialized content series (e.g., Les Misérables chapter-by-chapter commentary) with automatic sequential numbering, consistent folder structure, and pre-populated frontmatter.

## Purpose

For long-running blog series (like "Les Misérables: A Chapter A Day"), creating a new post requires:
1. Determining the next sequential post number
2. Creating a folder with the correct naming convention
3. Creating an `index.md` file with frontmatter template
4. Populating metadata fields (part, book, chapter, tags, etc.)

This skill automates all four steps and prevents naming collisions, date/numbering errors, and frontmatter schema mismatches.

Derived from 97+ existing posts in the `les-miserables` series. See [EVOLUTION_LOG.md](../../knowledge_base/EVOLUTION_LOG.md) for the original pattern analysis.

## When to Use

Load this skill when the task is:
- Creating a new post in an existing serialized blog series
- Setting up multiple posts for a series release
- Automating post creation via CLI or GitHub Action
- Ensuring consistent frontmatter and folder naming across all series posts

## Prerequisites

- Astro SSG project with `src/content/blog/` collection
- Series already exists (folder in `src/content/series/`)
- At least one existing post in the series to establish the pattern
- Understanding of the series structure (e.g., Part/Book/Chapter hierarchy)

## Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `{{ v_series_slug }}` | string | yes | Series identifier (e.g., `les-miserables`) — must match folder in `src/content/series/` |
| `{{ v_post_number }}` | string or `auto` | no | 3-digit zero-padded post number (e.g., `097`) or `auto` to detect next sequential number. Defaults to `auto`. |
| `{{ v_part }}` | string | yes | Part identifier in lowercase hyphenated form (e.g., `part-1`, `part-2`) |
| `{{ v_book }}` | string | yes | Book identifier in lowercase hyphenated form (e.g., `book-1`, `book-3`) |
| `{{ v_chapter }}` | string | yes | Chapter identifier in lowercase hyphenated form (e.g., `chapter-1`, `chapter-5`) |
| `{{ v_title }}` | string | no | Post subtitle (appends to auto-generated series prefix). Example: `"Cosette & The Doll"` auto-generates to `"Les Miserables: Cosette & The Doll"`. Leave empty to scaffold with series name only. |
| `{{ v_description }}` | string | no | Post summary suffix. Example: `"A large doll reveals Cosette's reality to her and us"` auto-generates to `"Part two, book three, chapter four - A large doll reveals Cosette's reality to her and us"`. Leave empty to scaffold with part/book/chapter prefix only. |
| `{{ v_tags }}` | string (comma-separated) | no | Post tags (e.g., `cosette,thenardier,desire,beauty,reality`). Converted to YAML array. Defaults to empty. |
| `{{ v_date }}` | string (YYYY-MM-DD) | no | Publication date. Format: `YYYY-MM-DD` (e.g., `2026-04-09`). Defaults to today's date (UTC). |
| `{{ v_draft }}` | boolean | no | Draft state flag. Defaults to `true` (draft mode). Use `--published` flag to set `draft: false` for published posts. |

## Example Usage

### Create the next Les Misérables post with auto-numbering and custom date:

```bash
astro-blog-series-scaffold \
  --series "les-miserables" \
  --part "part-2" \
  --book "book-3" \
  --chapter "chapter-7" \
  --title "Valjean's Journey to Montfermeil" \
  --description "Hugo reveals the Christmas night where Valjean and Cosette were fated to meet" \
  --tags "valjean,cosette,montfermeil,fate" \
  --date "2026-04-09"
```

**Result:**
- Folder: `src/content/blog/lm-099-part-2-book-3-chapter-7/`
- File: `index.md` with frontmatter:
  - Title: `"Les Miserables: Valjean's Journey to Montfermeil"`
  - Description: `"Part 2, book 3, chapter 7 - Hugo reveals the Christmas night where Valjean and Cosette were fated to meet"`
  - Date: `2026-04-09`

### Create with explicit post number:

```bash
astro-blog-series-scaffold \
  --series "les-miserables" \
  --number "097" \
  --part "part-2" \
  --book "book-3" \
  --chapter "chapter-5"
```

### Create a draft post (no title/description yet):

```bash
astro-blog-series-scaffold \
  --series "les-miserables" \
  --part "part-2" \
  --book "book-3" \
  --chapter "chapter-6" \
  --draft
```

## Playbook

### Step 1 — Validate Inputs

1. **Verify series exists:**
   - Check that `src/content/series/{{ v_series_slug }}/` directory exists
   - If not, exit with error: `"Series '{{ v_series_slug }}' not found in src/content/series/"`

2. **Resolve post number:**
   - If `{{ v_post_number }}` is `auto`:
     - Scan `src/content/blog/` for existing posts matching pattern `<series_prefix>-<3-digit-number>-*`
     - Find the highest existing post number
     - Increment by 1 and zero-pad to 3 digits
     - Example: If `lm-096-*` exists, next is `lm-097`
   - If `{{ v_post_number }}` is explicit:
     - Ensure it's 3-digit zero-padded
     - Check that no post with this number already exists in `src/content/blog/`
     - If collision detected, exit with error: `"Post lm-{{ v_post_number }}-* already exists"`

3. **Validate part/book/chapter format:**
   - Each must match regex: `^[a-z]+-\d+$` (e.g., `part-2`, `book-3`, `chapter-5`)
   - If invalid, exit with error: `"{{ v_book }} does not match format 'book-N' (lowercase, hyphenated)"`

4. **Determine series prefix:**
   - Extract first two letters of `{{ v_series_slug }}` (e.g., `les-miserables` → `lm`)
   - Or use full abbreviation if available in project config (preferred)

### Step 2 — Construct Folder Path

```
{{ folder_path }} = src/content/blog/{{ series_prefix }}-{{ v_post_number }}-{{ v_part }}-{{ v_book }}-{{ v_chapter }}/
```

Example: `src/content/blog/lm-097-part-2-book-3-chapter-5/`

### Step 3 — Create Folder and File

```bash
mkdir -p "{{ folder_path }}"
touch "{{ folder_path }}/index.md"
```

### Step 4 — Generate Frontmatter

Use the following YAML template, populating only non-empty fields:

```yaml
---
title: "{{ v_title }}"
description: "{{ v_description }}"
date: "{{ current_date_iso }}"
draft: {{ v_draft }}
series: "{{ v_series_slug }}"
part: "{{ v_part }}"
book: "{{ v_book }}"
chapter: "{{ v_chapter }}"
tags:
{{ tags_yaml_array }}
---
```

**Notes:**
- `{{ current_date_iso }}`: Today's date in ISO format (e.g., `2026-04-07`)
- `{{ tags_yaml_array }}`: Convert comma-separated tags to YAML array (e.g., `cosette,desire` → `  - cosette\n  - desire`)
- If `{{ v_title }}` is empty, leave as `title: ""`
- If `{{ v_description }}` is empty, leave as `description: ""`
- If `{{ v_tags }}` is empty, leave as `tags: []` or omit entirely

### Step 5 — Write File

Write the frontmatter and an empty body to `{{ folder_path }}/index.md`:

```
---
title: "..."
description: "..."
...
---

```

(One blank line after the closing `---`, then empty body ready for content authoring.)

### Step 6 — Output and Return

Print to stdout:
```
✅ Created: {{ folder_path }}/
📄 File: {{ folder_path }}/index.md
🏷️  Post number: {{ series_prefix }}-{{ v_post_number }}
📝 Tags: [{{ v_tags }}]
✍️  Ready for content authoring.
```

Return exit code `0` on success, non-zero on error.

## Implementation Reference

A reference implementation in Bash is provided in `scaffold.sh` (see sidebar). The script:
- Handles auto-numbering by scanning existing posts
- Validates all inputs
- Generates YAML frontmatter correctly
- Outputs human-readable status messages
- Supports both CLI and programmatic invocation

## Known Limitations & Exceptions

### Limitation 1: Series Prefix Detection
The skill assumes a 2–3 letter series prefix (e.g., `les-miserables` → `lm`). For series with ambiguous prefixes, configure the prefix in `src/content/config.ts` or pass `--prefix` as an optional parameter.

### Limitation 2: Frontmatter Schema Compliance
The generated frontmatter must match the Astro collection schema defined in `src/content/config.ts`. If the schema changes (e.g., new required fields), this skill must be updated.

### Limitation 3: Empty Content
The scaffold creates a post with an empty body. If a post should include boilerplate content (e.g., "## Summary" section), a future enhancement could accept `--content-file` to populate the body at creation time.

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Series doesn't exist | Exit with error; suggest `src/content/series/` directories |
| Post number collision | Exit with error; show existing post and suggest incrementing |
| Invalid part/book/chapter format | Exit with error; show expected format |
| Empty title in draft | Allowed; title can be populated later |
| Very long series (1000+ posts) | Auto-numbering scans entire directory; consider indexing optimization if performance degrades |
| Non-ASCII characters in title/description | Preserve as-is in YAML string (YAML supports UTF-8); no escaping needed unless special YAML characters like `:` or `#` |

## Testing

Verify the skill with the following test cases:

1. **Auto-numbering:** Run scaffold for `lm-097` with `--number auto`; verify folder matches `lm-097-part-2-book-3-chapter-5/`
2. **Explicit numbering:** Run scaffold with `--number "098"`; verify post number is `lm-098`
3. **Collision detection:** Run twice with same `--number`; second run should error
4. **Empty draft:** Run with `--draft` and no title/description; verify frontmatter has empty strings and `draft: true`
5. **Tags generation:** Run with `--tags "cosette,desire,beauty"`; verify YAML array is correctly formatted

## Related Skills

- [astro-buildtime-api-lib](../astro-buildtime-api-lib/) — Build-time data fetching for Astro (commonly used to enrich blog post metadata)
- [astro-runtime-accent-theming](../astro-runtime-accent-theming/) — Runtime theming; useful if blog posts render theme-aware components

## See Also

- `src/content/config.ts` — Astro collection schema (defines frontmatter fields)
- `src/content/blog/` — Blog post collection
- `src/content/series/` — Series metadata
- `.opencode/knowledge_base/STANDARDS.md` — Blog post naming conventions
