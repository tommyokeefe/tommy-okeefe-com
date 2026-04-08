---
name: example-skill
description: Brief description of what this skill does (1-1024 characters)
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: example
---

# Example Skill Template

This is a template for creating new skills in the OpenCode framework. Use it as a starting point for any new skill you develop. See `.opencode/skills/astro-buildtime-api-lib/SKILL.md` for the canonical reference implementation of a certified skill.

## Purpose

Clear, concise explanation of what this skill does and the problem it solves.

## When to Use

Describe the scenarios where this skill should be loaded and used. Help agents understand when to invoke this skill.

## Prerequisites

- List any required setup
- Document dependencies
- Note any configuration needed

## Input Parameters

If your skill accepts parameters, document them here:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `{{ v_param1 }}` | string | yes | Description of param1 |
| `{{ v_param2 }}` | string | no | Description of param2 |

## Example Usage

Provide a concrete example with a filled-in parameter table:

| Parameter | Value |
|---|---|
| `{{ v_param1 }}` | `example-value` |

**Produces:**
1. File or artifact 1
2. File or artifact 2

## Playbook

### Step 1 — [Action]

Description of what to do and why. Include code blocks where applicable.

### Step 2 — [Action]

...

### Step N — Verify

Always end with a verification step. Specify the exact commands and what "passing" looks like.

## Rules & Constraints

All of these are enforced by @REFLECTOR. This section is **mandatory** — never omit it. List every rule that a future developer might be tempted to violate:

- **Rule 1.** Explanation of why this rule exists.
- **Rule 2.** Explanation of why this rule exists.

## Output

Describe what the skill delivers:
- What artifact(s) are produced?
- What format are results in?
- How can agents use the output?

## Framework Compliance

This skill follows Evolution Loop principles:

- ✅ **Traceability** — All operations logged in EVOLUTION_LOG
- ✅ **Security** — No credentials/secrets embedded
- ✅ **Simplicity** — Single, well-defined purpose
- ✅ **Idempotency** — Safe to run multiple times
- ✅ **Artifact Minimalism** — Produces only necessary outputs

## Related Standards

- `STANDARDS.md` § "[Relevant section name]"

## Known Exceptions

If there are narrow, permanent deviations from the playbook that are accepted and documented, list them here with an explanation. If there are no known exceptions, write "None." Do not omit this section — its absence implies no exceptions have been considered.

---

## Creating Your Own Skill

**To create a new skill:**

1. Create directory: `.opencode/skills/<skill-name>/`
2. Create `SKILL.md` file with:
   - Valid frontmatter (required fields: `name`, `description`)
   - Name must match directory name (lowercase, hyphens only, no leading/trailing hyphens)
3. Document all required sections (see template above — every section is required)
4. Submit to @REFLECTOR before considering the skill certified
5. After @REFLECTOR approval, log the promotion in EVOLUTION_LOG.md and update the Candidate Patterns table

**Validation checklist:**
- [ ] Name is lowercase alphanumeric with single hyphens only
- [ ] Name matches directory name
- [ ] `description` is 1-1024 characters
- [ ] Frontmatter is valid YAML
- [ ] File is named `SKILL.md` (all caps)
- [ ] `Prerequisites` section present
- [ ] `Rules & Constraints` section present (mandatory — @REFLECTOR will flag its absence)
- [ ] `Known Exceptions` section present (write "None." if no exceptions)
- [ ] `Related Standards` section cross-links to relevant STANDARDS.md entries
- [ ] `Framework Compliance` checklist complete
- [ ] Examples are provided with filled-in parameter values
- [ ] @REFLECTOR audit completed and passed before promotion

**For more details:**
- See `.opencode/core/CONSTITUTION.md` for framework principles
- See `.opencode/knowledge_base/STANDARDS.md` for project conventions
- See `.opencode/knowledge_base/EVOLUTION_LOG.md` for pattern history
- See `.opencode/skills/astro-buildtime-api-lib/SKILL.md` for the canonical certified skill example
