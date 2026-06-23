# Programming-Style Scripts

## Overview

| Script              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `check.py`          | Wrapper — runs all check scripts           |
| `check-naming.py`   | Naming conventions (files, symbols, case)  |
| `check-comments.py` | Comments, TODOs, and error handling        |
| `check-formatting.py` | File size, blank lines, stray logs       |
| `_common.py`        | Shared Finding class, helpers, config      |

---

## check.py (wrapper)

Runs `check-naming.py` + `check-comments.py` + `check-formatting.py` in one pass.

```bash
python3 check.py src/
python3 check.py src/services/QueuesService.ts src/jobs/billing/CreateInvoiceJob.ts
```

---

## check-naming.py

Naming conventions for files, exports, and symbols.

```bash
python3 check-naming.py src/
```

| Rule                  | Severity | Checks                                            |
| --------------------- | -------- | ------------------------------------------------- |
| vague-filename        | WARN     | `helpers.ts`, `utils.py`, `types.ts`, etc.        |
| vendor-named-service  | WARN     | `PgBossService`, `AxiosService`, etc.             |
| file-name-mismatch    | WARN     | File name does not match main exported symbol     |
| naming-case           | WARN/INFO| Wrong case for class/type/function                |
| vague-symbol          | INFO     | Symbol contains `Manager`, `Helper`, `Utils`      |

---

## check-comments.py

Comment quality and error handling rules.

```bash
python3 check-comments.py src/
```

| Rule              | Severity | Checks                                            |
| ----------------- | -------- | ------------------------------------------------- |
| todo-no-owner     | WARN     | `TODO` without `(name)` owner                     |
| fixme-no-owner    | WARN     | `FIXME` without `(name)` owner                    |
| obvious-comment   | INFO     | Comment narrates obvious code                     |
| swallow-catch     | WARN     | Empty `catch {}` or `except: pass`                |

---

## check-formatting.py

File size, blank lines, stray logs, and function length.

```bash
python3 check-formatting.py src/
```

| Rule              | Severity | Checks                                            |
| ----------------- | -------- | ------------------------------------------------- |
| file-too-large    | INFO     | File exceeds 500 lines                            |
| extra-blank-lines | INFO     | Three or more blank lines in a row                |
| stray-console     | INFO     | `console.log`/`console.debug` left in source      |
| long-function     | INFO     | Function exceeds 80 lines                         |

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

## Supported Extensions

`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`
