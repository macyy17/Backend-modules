#!/usr/bin/env python3
"""
check-correctness — API correctness rules.

Rules:
    status-200-error   WARN   HTTP 200 with error payload
    get-mutation        WARN   GET handler that mutates data
    swallow-catch       WARN   empty catch block
"""

from __future__ import annotations

import os
import re
import sys

from _common import CODE_EXTS, Finding, file_ext, read_lines, run_checks


def check_status_200_for_error(path: str, lines: list[str], findings: list[Finding]) -> None:
    pat = re.compile(
        r"status\s*\(\s*200\s*\)[^;]*\.(json|send)\s*\(\s*\{[^}]*\b(error|ok\s*:\s*false)\b"
    )
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            findings.append(Finding(
                path, i, "WARN", "status-200-error",
                "status 200 with error payload — use a 4xx/5xx code",
            ))


def check_get_mutation(path: str, lines: list[str], findings: list[Finding]) -> None:
    pat = re.compile(r"\.get\(\s*[\"'][^\"']+[\"']\s*,")
    mutate_words = re.compile(r"\b(create|update|delete|insert|remove|save|destroy)[A-Za-z_]*\s*\(", re.IGNORECASE)
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            window = "\n".join(lines[i - 1: i + 12])
            if mutate_words.search(window):
                findings.append(Finding(
                    path, i, "WARN", "get-mutation",
                    "GET handler appears to mutate — use POST/PUT/PATCH/DELETE",
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
                "empty catch — return a structured error or rethrow",
            ))


def run(paths: list[str], findings: list[Finding]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        if file_ext(path) not in CODE_EXTS:
            continue
        lines = read_lines(path)
        if lines is None:
            continue
        check_status_200_for_error(path, lines, findings)
        check_get_mutation(path, lines, findings)
        check_swallow_catch(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-correctness.py", run))
