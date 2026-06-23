#!/usr/bin/env python3
"""
check-comments — comment and error-handling rules.

Rules:
    todo-no-owner    WARN   TODO without (name) owner
    fixme-no-owner   WARN   FIXME without (name) owner
    obvious-comment  INFO   comment narrates obvious code
    swallow-catch    WARN   empty catch {} or except: pass
"""

from __future__ import annotations

import os
import re
import sys

from _common import (
    SOURCE_EXTS,
    Finding,
    file_ext,
    read_lines,
    run_checks,
)


def check_bad_comments(path: str, lines: list[str], findings: list[Finding]) -> None:
    todo_pat = re.compile(r"(?://|#)\s*TODO\b(?!\s*\([^)]+\))", re.IGNORECASE)
    fixme_pat = re.compile(r"(?://|#)\s*FIXME\b(?!\s*\([^)]+\))", re.IGNORECASE)
    obvious_pat = re.compile(r"^\s*(?://|#)\s*(set|get|handle|do|process)\s+(\w+)\s*$", re.IGNORECASE)
    for i, line in enumerate(lines, start=1):
        if todo_pat.search(line):
            findings.append(Finding(
                path, i, "WARN", "todo-no-owner",
                "TODO has no owner — use `TODO(name): action`",
            ))
        elif fixme_pat.search(line):
            findings.append(Finding(
                path, i, "WARN", "fixme-no-owner",
                "FIXME has no owner — use `FIXME(name): action`",
            ))
        if obvious_pat.match(line):
            findings.append(Finding(
                path, i, "INFO", "obvious-comment",
                "comment narrates obvious code — remove or explain intent",
            ))


def check_swallow_catch(path: str, lines: list[str], findings: list[Finding]) -> None:
    ext = file_ext(path)
    if ext in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        pat = re.compile(r"catch\s*\([^)]*\)\s*\{\s*\}")
    elif ext == ".py":
        pat = re.compile(r"except[^:]*:\s*pass\s*$")
    else:
        return
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            findings.append(Finding(
                path, i, "WARN", "swallow-catch",
                "empty catch — handle, log, or rethrow with context",
            ))


def run(paths: list[str], findings: list[Finding]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        if file_ext(path) not in SOURCE_EXTS:
            continue
        lines = read_lines(path)
        if lines is None:
            continue
        check_bad_comments(path, lines, findings)
        check_swallow_catch(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-comments.py", run))
