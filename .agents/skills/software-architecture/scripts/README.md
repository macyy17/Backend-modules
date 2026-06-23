# Software-Architecture Scripts

## Overview

| Script             | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `check.py`         | Wrapper — runs all check scripts              |
| `check-layers.py`  | Layer boundary and import direction rules     |
| `check-layout.py`  | Project layout and file organization rules    |
| `check-naming.py`  | Postfix and naming consistency rules          |
| `map.py`           | Print project layer map                       |
| `_common.py`       | Shared Finding class, helpers, config         |

---

## check.py (wrapper)

Runs `check-layers.py` + `check-layout.py` + `check-naming.py` in one pass.

```bash
python3 check.py src/
python3 check.py src/core/classes/planning/DayPlan.ts src/services/billing/InvoicesService.ts
```

---

## check-layers.py

Layer boundary and import direction rules.

```bash
python3 check-layers.py src/
```

| Rule                | Severity | Checks                                                  |
| ------------------- | -------- | ------------------------------------------------------- |
| layer-violation     | WARN     | A layer imports from a forbidden layer                  |
| core-imports-infra  | WARN     | `core/` file imports an infrastructure package          |
| core-reads-env      | WARN     | `core/` file reads `process.env` / `os.environ`        |
| cross-module-import | WARN     | One module imports from a sibling module                |
| test-in-src         | WARN     | Test file living under `src/`                           |

---

## check-layout.py

Project layout and file organization rules.

```bash
python3 check-layout.py src/
```

| Rule                | Severity | Checks                                                  |
| ------------------- | -------- | ------------------------------------------------------- |
| generic-dump-folder | INFO     | `utils`/`helpers`/`common` folder outside `core/`       |
| vague-file          | WARN     | Files like `types.ts`, `helpers.ts`, `utils.py`         |
| file-too-large      | INFO     | File over 500 lines                                     |

---

## check-naming.py

Postfix and naming consistency rules.

```bash
python3 check-naming.py src/
```

| Rule             | Severity | Checks                                                  |
| ---------------- | -------- | ------------------------------------------------------- |
| missing-postfix  | INFO     | File under `controllers/` not ending in `Controller`    |
| worker-naming    | INFO     | Worker file not ending in `_worker`                     |

---

## map.py

Print a project's layer map — shows which files belong to each layer.

```bash
python3 map.py src/               # full file list per layer
python3 map.py src/ --counts      # file counts only
```

---

## Layer Detection

A file's layer is inferred from its path segments:

| Segment(s)                                         | Layer          |
| -------------------------------------------------- | -------------- |
| `controllers`, `routes`, `middlewares`, `workers`   | transport      |
| `services`, `jobs`, `queues`, `events`, `listeners` | application   |
| `repositories`, `database`, `db`, `providers`      | infrastructure |
| `core` (non-utils)                                 | domain         |
| `core/utils`                                       | utils          |
| `types`, `interfaces`                              | contract       |
| `samples`                                          | test-support   |
| `examples`                                         | examples       |
| `tests`                                            | tests          |

---

## Output Format

All check scripts emit:

```
path:line: [SEVERITY] [RULE] message
```

## Exit Codes

| Code | Meaning          |
| ---- | ---------------- |
| 0    | No findings      |
| 1    | Findings emitted |
| 2    | Bad invocation   |
