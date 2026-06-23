---
name: software-architecture
description: Plans, reviews, or refactors high-level code structure (layers, dependency direction, project layout, code splitting, multi-module boundaries); includes a script that prints concise file-line findings.
version: 1.0.0
author: MAbdullahAhmad
tags: [architecture, layers, boundaries, layout, code-splitting, multi-module]
triggers:
  - "where should this file go"
  - "review imports for boundary violations"
  - "refactor this folder"
  - "plan project layout"
  - "split into modules"
  - "fix circular imports"
---

# SKILL: Software Architecture

## When to Use This Skill

Activate when the user asks to:
- Decide where a new file or feature belongs.
- Review imports for boundary or dependency-direction violations.
- Refactor a folder or layer to fit the project structure.
- Plan a single-module or multi-module project layout.
- Diagnose tangled imports or circular dependencies.

Do NOT activate when:
- The change is purely about names, comments, or formatting → use `programming-style`.
- The change is about HTTP request/response details → use `api-dev`.
- The change is about UI components → use `frontend-dev`.

---

## Phase 1 — Detect Issues

Run the check script on a directory or one or more files. It prints
`path:line: [SEVERITY] [RULE] message`.

```bash
python3 skills/software-architecture/scripts/check.py src/
python3 skills/software-architecture/scripts/check.py src/core/classes/planning/DayPlan.ts
```

Pick the right script for the job:

| Script             | When to use                                            |
| ------------------ | ------------------------------------------------------ |
| `check.py`         | Full audit — runs all checks                           |
| `check-layers.py`  | Layer boundaries only (import direction, core purity)  |
| `check-layout.py`  | Layout only (dump folders, vague files, file size)     |
| `check-naming.py`  | Naming only (postfixes, worker conventions)            |
| `map.py`           | Print layer map (not a checker — informational)        |

To see the project's layer map before fixing:

```bash
python3 skills/software-architecture/scripts/map.py src/
python3 skills/software-architecture/scripts/map.py src/ --counts
```

See `scripts/README.md` for the full rule list.

---

## Phase 2 — Plan Moves Before Editing

Group findings by layer and by file. **Propose moves first**, then apply:

1. Fix layer violations (e.g., `core/` importing `services/`):
   - Extract the imported behavior into core, or
   - Invert the dependency through an interface, or
   - Move the orchestration to a service.
2. Remove infrastructure from `core/` (db clients, HTTP clients, `process.env`).
3. Move tests under `src/` to `tests/`.
4. Rename generic dump folders (`utils/`, `helpers/`, `common/`) into
   responsibility-based folders (except `core/utils/` which is allowed).
5. Apply postfix naming for files in their responsibility folders
   (`Controller`, `Service`, `Job`, `Queue`, `Event`, `Listener`,
   `Repository`, `_worker`).
6. Split files exceeding ~500 lines along responsibility boundaries.
7. For multi-module repos, extract cross-module imports into a shared package.

For deeper rules, read only the topic that matches the task:

| Topic                  | File                              |
| ---------------------- | --------------------------------- |
| Project layout         | `details/project-layout.md`       |
| Layers and boundaries  | `details/layers.md`               |
| Dependency direction   | `details/dependencies.md`         |
| Code splitting         | `details/splitting.md`            |
| Multi-module projects  | `details/multi-module.md`         |

---

## Phase 3 — Verify

1. Re-run `scripts/check.py` on the changed tree — no `layer-violation`,
   `core-imports-infra`, `core-reads-env`, or `cross-module-import`.
2. Confirm no generic dump folders remain outside `core/utils/`.
3. Confirm every responsibility folder enforces its postfix convention.
4. Report changes as a moves list (`from → to`) plus a list of
   `file:line - rule - fix`.

---

## Quick Reference

### Layers and Dependency Direction

```
transport     -> services -> core
transport     -> services -> infrastructure
workers       -> services -> core
tests         -> source code
```

Core never points back to app infrastructure.

### Folder → Layer Map

| Folder                                                  | Layer          |
| ------------------------------------------------------- | -------------- |
| `controllers/`, `routes/`, `middlewares/`, `workers/`   | transport      |
| `services/`, `jobs/`, `queues/`, `events/`, `listeners/`| application    |
| `repositories/`, `database/`, `db/`, `providers/`       | infrastructure |
| `core/` (non-utils)                                     | domain         |
| `core/utils/`                                           | utils          |
| `types/`, `interfaces/`                                 | contract       |
| `samples/`                                              | test-support   |
| `examples/`                                             | examples       |
| `tests/`                                                | tests          |

### Forbidden Imports (script enforces)

| Layer            | Must NOT import from                            |
| ---------------- | ----------------------------------------------- |
| domain (`core/`) | transport, application, infrastructure          |
| utils            | transport, application, infrastructure, domain  |
| contract         | transport, application, infrastructure          |
| infrastructure   | transport, application                          |
| application      | transport                                       |

### Script Rules (summary)

| Rule                | Severity | Meaning                                                    |
| ------------------- | -------- | ---------------------------------------------------------- |
| layer-violation     | WARN     | A layer imports from a forbidden layer                     |
| core-imports-infra  | WARN     | `core/` file imports an infrastructure package             |
| core-reads-env      | WARN     | `core/` file reads `process.env` / `os.environ`            |
| vague-file          | WARN     | `types.ts`, `helpers.ts`, `utils.py`                       |
| test-in-src         | WARN     | Test file living under `src/`                              |
| cross-module-import | WARN     | One module imports from a sibling module                   |
| generic-dump-folder | INFO     | `utils`/`helpers`/`common` folder outside `core/`          |
| missing-postfix     | INFO     | File under `controllers/` not ending in `Controller`, etc. |
| worker-naming       | INFO     | Worker file not ending in `_worker`                        |
| file-too-large      | INFO     | File over 500 lines                                        |

---

## Common Mistakes to Avoid

| Anti-pattern                                                       | Correct approach                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `core/` importing from `services/`                                 | Move pure behavior into `core/`; orchestration stays in services       |
| `core/` reading `process.env` / `os.environ`                       | Pass config in through function/method parameters                      |
| `core/` importing `axios`, `pg`, `prisma`, `bullmq`                | Keep core infra-free; access these via repositories/providers          |
| `src/utils/`, `src/helpers/`, `src/common/` as global dumps        | Group by responsibility; only `core/utils/` is allowed                 |
| `helpers.ts`, `types.ts`, `utils.ts` files                         | Name files by responsibility                                           |
| Test files like `*.test.ts` under `src/`                           | Move to `tests/` mirroring the source path                             |
| One `src/services/` flat folder with 20+ unrelated services         | Categorize: `services/auth/`, `services/billing/`, etc.                |
| `index.ts` re-exporting the entire app tree                        | Keep index files local to bounded folders; avoid global barrels        |
| Modules in `servers/api/` importing from `servers/dashboard/`      | Extract a shared package; modules do not cross-import                  |
| 800-line file mixing transport + business + persistence            | Split: controller → service → repository                               |

---

## Quality Checklist

- [ ] `scripts/check.py` returns no WARN findings on the changed tree.
- [ ] No file under `core/` imports from `services/`, `controllers/`,
      `routes/`, `middlewares/`, or `database/`.
- [ ] No file under `core/` reads environment variables directly.
- [ ] No generic dump folders (`utils/`, `helpers/`, `common/`) outside
      `core/utils/`.
- [ ] Files in responsibility folders use the expected postfix
      (`Controller`, `Service`, `Job`, etc.).
- [ ] No test files live under `src/`.
- [ ] No sibling-module cross-imports in a multi-module repo.
- [ ] No new file exceeds ~500 lines without a split plan.

---

## Changelog

| Version | Date       | Change          |
| ------- | ---------- | --------------- |
| 1.0.0   | 2026-05-21 | Initial release |
