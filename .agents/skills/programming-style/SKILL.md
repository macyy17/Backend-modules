---
name: programming-style
description: Reviews or writes code that follows consistent naming, file structure, comments, error handling, and formatting conventions; includes a script that prints concise file-line findings.
version: 1.0.0
author: MAbdullahAhmad
tags: [style, naming, comments, errors, formatting, lint]
triggers:
  - "review code style"
  - "rename this function"
  - "is this file too big"
  - "fix naming"
  - "match project conventions"
  - "audit naming or comments"
---

# SKILL: Programming Style

## When to Use This Skill

Activate when the user asks to:
- Review code for naming, comments, file structure, error handling, or formatting.
- Rename or restructure files, classes, or functions.
- Write new files that must match project conventions.
- Audit naming or comment style across a folder.

Do NOT activate when:
- The work is high-level architecture or layer decisions → use `software-architecture`.
- The work is HTTP/API design → use `api-dev`.
- The work is UI/component design → use `frontend-dev`.

---

## Phase 1 — Detect Issues

Run the check script on the target file(s) or folder. It prints
`path:line: [SEVERITY] [RULE] message`.

```bash
python3 skills/programming-style/scripts/check.py FILE [FILE ...]
python3 skills/programming-style/scripts/check.py src/
```

Pick the right script for the job:

| Script               | When to use                                          |
| -------------------- | ---------------------------------------------------- |
| `check.py`           | Full audit — runs all checks                         |
| `check-naming.py`    | Naming only (vague names, case, file-export match)   |
| `check-comments.py`  | Comments and error handling (TODOs, catch blocks)    |
| `check-formatting.py`| Size and formatting (file length, blank lines, logs) |

See `scripts/README.md` for the full rule list and exit codes.

---

## Phase 2 — Apply Fixes

Apply changes in this order:

1. Fix vague file names and vendor-named services (rename + update imports).
2. Match file name to the main exported symbol.
3. Replace vague symbols (`Manager`, `Helper`, `Data*`, `Common*`).
4. Add owners to `TODO`/`FIXME` (`TODO(name): action`).
5. Remove obvious comments; keep intent-explaining comments.
6. Replace empty `catch {}` / `except: pass` with structured handling.
7. Split files exceeding ~500 lines along responsibility boundaries.

For deeper rules, read only the topic(s) that match the task:

| Topic                | File                                |
| -------------------- | ----------------------------------- |
| Naming               | `details/naming.md`                 |
| File structure       | `details/file-structure.md`         |
| Comments             | `details/comments.md`               |
| Errors and results   | `details/errors-and-results.md`     |
| Formatting           | `details/formatting.md`             |

---

## Phase 3 — Verify

1. Re-run `scripts/check.py` on changed files — must exit `0` or only `INFO`.
2. Confirm file names match the main exported symbol.
3. Confirm no vague names or ownerless TODOs remain.
4. Report changes as `file:line - rule - fix`.

---

## Quick Reference

### Case Rules

| Symbol     | Case        |
| ---------- | ----------- |
| Classes    | CapitalCase |
| Types      | CapitalCase |
| Interfaces | CapitalCase |
| Functions  | snake_case  |
| Variables  | snake_case  |
| Constants  | UPPER_CASE  |

### Required Postfixes

| Kind          | Postfix      |
| ------------- | ------------ |
| Service       | `Service`    |
| Controller    | `Controller` |
| Middleware    | `Middleware` |
| Guard         | `Guard`      |
| Job           | `Job`        |
| Queue         | `Queue`      |
| Event         | `Event`      |
| Listener      | `Listener`   |
| Type alias    | `Type`       |
| Interface     | `Interface`  |
| Repository    | `Repository` |
| CLI worker    | `_worker`    |

### Script Rules (summary)

| Rule                 | Severity  | Meaning                                  |
| -------------------- | --------- | ---------------------------------------- |
| vague-filename       | WARN      | `helpers.ts`, `utils.py`, `types.ts`     |
| vendor-named-service | WARN      | `PgBossService`, `AxiosService`          |
| file-name-mismatch   | WARN      | File ≠ main exported symbol              |
| todo-no-owner        | WARN      | `TODO` without `(name)`                  |
| swallow-catch        | WARN      | Empty `catch {}` / `except: pass`        |
| obvious-comment      | INFO      | Comment restates code                    |
| file-too-large       | INFO      | > 500 lines                              |
| long-function        | INFO      | > 80 lines                               |
| stray-console        | INFO      | `console.log`/`debug` left in source     |

---

## Common Mistakes to Avoid

| Anti-pattern                                  | Correct approach                                  |
| --------------------------------------------- | ------------------------------------------------- |
| `helpers.ts`, `utils.py`, `types.ts`          | Name files by responsibility                      |
| `PgBossService`, `AxiosService`               | Name services by role (`QueuesService`)           |
| `DataManager`, `CommonHelper`, `MiscUtils`    | Use a role-specific name                          |
| `TODO finish this`                            | `TODO(alice): handle empty input`                 |
| `// Set user id` then `user_id = user.id;`    | Delete; the code already says this                |
| `catch (e) {}` to silence errors              | Log, add context, or rethrow                      |
| One 800-line file mixing 5 responsibilities   | Split along responsibility boundaries             |
| Returning `null`/`false`/`-1` for unrelated failures | Use a `Result` type with explicit shapes   |

---

## Quality Checklist

- [ ] `scripts/check.py` returns no WARN findings on changed files.
- [ ] Every file name matches its main exported symbol.
- [ ] No `helpers`, `utils`, `common`, `manager`, `misc` in new names.
- [ ] Every `TODO`/`FIXME` has an owner.
- [ ] No `catch {}` / `except: pass` was added.
- [ ] No comment narrates obvious code.
- [ ] No file added is over 500 lines without a split plan.

---

## Changelog

| Version | Date       | Change          |
| ------- | ---------- | --------------- |
| 1.0.0   | 2026-05-21 | Initial release |
