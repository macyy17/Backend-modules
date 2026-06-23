#!/usr/bin/env python3
"""
check-formatting — file size, blank lines, stray logs, and function length rules.

Rules:
    file-too-large     INFO   file exceeds 500 lines
    extra-blank-lines  INFO   three or more blank lines in a row
    stray-console      INFO   console.log/debug left in source
    long-function      INFO   function exceeds 80 lines
"""

from __future__ import annotations

import os
import re
import sys

from _common import (
    MAX_FILE_LINES,
    MAX_FUNC_LINES,
    SOURCE_EXTS,
    Finding,
    file_ext,
    read_lines,
    run_checks,
)


def check_file_size(path: str, lines: list[str], findings: list[Finding]) -> None:
    n = len(lines)
    if n > MAX_FILE_LINES:
        findings.append(Finding(
            path, n, "INFO", "file-too-large",
            f"file has {n} lines — consider splitting (>{MAX_FILE_LINES})",
        ))


def check_double_blank(path: str, lines: list[str], findings: list[Finding]) -> None:
    streak = 0
    for i, line in enumerate(lines, start=1):
        if line.strip() == "":
            streak += 1
            if streak == 3:
                findings.append(Finding(
                    path, i, "INFO", "extra-blank-lines",
                    "three or more blank lines in a row",
                ))
        else:
            streak = 0


def check_console_left(path: str, lines: list[str], findings: list[Finding]) -> None:
    ext = file_ext(path)
    if ext not in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        return
    pat = re.compile(r"\bconsole\.(log|debug)\s*\(")
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            findings.append(Finding(
                path, i, "INFO", "stray-console",
                "stray console.log/debug — remove or use a logger",
            ))


def check_long_functions(path: str, lines: list[str], findings: list[Finding]) -> None:
    ext = file_ext(path)
    if ext == ".py":
        start_pat = re.compile(r"^(\s*)def\s+([A-Za-z_][A-Za-z0-9_]*)")
        in_func = None
        for i, line in enumerate(lines, start=1):
            m = start_pat.match(line)
            if m:
                if in_func is not None:
                    length = i - in_func[0]
                    if length > MAX_FUNC_LINES:
                        findings.append(Finding(
                            path, in_func[0], "INFO", "long-function",
                            f"function '{in_func[1]}' is {length} lines (>{MAX_FUNC_LINES})",
                        ))
                in_func = (i, m.group(2), len(m.group(1)))
            elif in_func and line.strip() and not line.startswith(" " * (in_func[2] + 1)) and not line.startswith("\t"):
                length = i - in_func[0]
                if length > MAX_FUNC_LINES:
                    findings.append(Finding(
                        path, in_func[0], "INFO", "long-function",
                        f"function '{in_func[1]}' is {length} lines (>{MAX_FUNC_LINES})",
                    ))
                in_func = None
        if in_func:
            length = len(lines) - in_func[0] + 1
            if length > MAX_FUNC_LINES:
                findings.append(Finding(
                    path, in_func[0], "INFO", "long-function",
                    f"function '{in_func[1]}' is {length} lines (>{MAX_FUNC_LINES})",
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
        check_file_size(path, lines, findings)
        check_double_blank(path, lines, findings)
        check_console_left(path, lines, findings)
        check_long_functions(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-formatting.py", run))
