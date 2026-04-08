# Skill Lifecycle Management

## 0. Discovery (The Proactive Trigger)
- **Trigger:** Successful completion of a Logical Task (Journey) by the Generator.
- **Action:** Generator invokes the Curator and Reflector once the Journey is signaled as complete.
- **Goal:** Identify repeatable patterns or improvements to existing skills.

## 1. Incubation
- **Trigger:** A new pattern is identified in the `EVOLUTION_LOG.md`.
- **Action:** Pattern logged in EVOLUTION_LOG Candidate Patterns table with status `Incubator`. Playbook steps documented in the EVOLUTION_LOG entry.
- **Threshold:** 2x manually-repeated instances in @REFLECTOR-approved Journeys.
- **Visibility:** Not discoverable by the main agent. No SKILL.md exists yet.

## 2. Candidate
- **Trigger:** 3rd @REFLECTOR-approved instance of the pattern (or 2x with strong cross-Journey evidence).
- **Action:** @CURATOR updates EVOLUTION_LOG Candidate Patterns table to `CANDIDATE`. Playbook spec is confirmed ready to draft.
- **Visibility:** Not yet discoverable. No SKILL.md exists.

## 3. Drafting & Refinement
- **Trigger:** @CURATOR recommends drafting; user approves.
- **Action:** Engineer drafts `SKILL.md` using `SKILL_TEMPLATE.md` as the structural baseline. Submit to @REFLECTOR for audit.
- **Required sections:** Purpose, When to Use, Prerequisites, Input Parameters, Example Usage, Playbook (numbered steps), Rules & Constraints, Output, Framework Compliance, Related Standards, Known Exceptions.
- **Reflector audit:** All blocking issues must be resolved before promotion. Non-blocking issues must be addressed or explicitly deferred with justification.
- **Location during drafting:** `.opencode/skills/<skill-name>/SKILL.md` (written directly to production path; not an incubator folder).

## 4. Certification & Promotion
- **Trigger:** @REFLECTOR approval (pass on final audit).
- **Action:** @CURATOR logs the Journey in EVOLUTION_LOG.md (including source instances, audit findings, and resolution summary). Updates Candidate Patterns table status to `CERTIFIED`.
- **Result:** Skill becomes discoverable and loadable by agents via the `skill()` tool.

## 5. Maintenance
- **Trigger:** Bug report, new instance of the pattern that reveals a gap, or standards update that invalidates a playbook step.
- **Action:** @CURATOR updates the skill in place and notes the change in EVOLUTION_LOG. If changes are major (new sub-cases, breaking structural changes), submit to @REFLECTOR for re-audit before merging.

---

## Promotion History

| Skill | Promoted | Source Instances | Notes |
|---|---|---|---|
| `astro-buildtime-api-lib` | 2026-04-07 | `lastfm.ts`, `reading.ts` | 2-pass @REFLECTOR audit; 6 issues (1 blocking) resolved. `accents.ts` documented as Known Exception. |
