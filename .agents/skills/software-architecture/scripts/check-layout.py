#!/usr/bin/env python3
"""
check-layout — project layout and file organization rules.

Rules:
    generic-dump-folder INFO   folder named utils/helpers/common outside core/
    vague-file          WARN   files like types.ts, helpers.ts, utils.py
    file-too-large      INFO   file over 500 lines
"""

from __future__ import annotations

import os
import sys

from _common import (
    CODE_EXTS,
    GENERIC_DUMP_DIRS,
    MAX_FILE_LINES,
    VAGUE_FILES,
    Finding,
    file_ext,
    norm,
    read_lines,
    run_checks,
)


def check_generic_dump_folder(path: str, findings: list[Finding]) -> None:
    p = norm(path)
    parts = p.split("/")
    for i, part in enumerate(parts):
        if part in GENERIC_DUMP_DIRS:
            if i > 0 and parts[i - 1] == "core":
                continue
            findings.append(Finding(
                path, 1, "INFO", "generic-dump-folder",
                f"'{part}' is a generic dump folder — group by responsibility instead",
            ))
            return


def check_vague_file(path: str, findings: list[Finding]) -> None:
    base = os.path.basename(path)
    p = norm(path)
    if base in {"index.ts", "index.js"}:
        return
    if base in VAGUE_FILES:
        findings.append(Finding(
            path, 1, "WARN", "vague-file",
            f"'{base}' is too vague — name by responsibility",
        ))


def check_big_file(path: str, lines: list[str], findings: list[Finding]) -> None:
    n = len(lines)
    if n > MAX_FILE_LINES:
        findings.append(Finding(
            path, n, "INFO", "file-too-large",
            f"file has {n} lines (>{MAX_FILE_LINES}) — likely mixes responsibilities",
        ))


def run(paths: list[str], findings: list[Finding]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        check_generic_dump_folder(path, findings)
        check_vague_file(path, findings)
        if file_ext(path) not in CODE_EXTS:
            continue
        lines = read_lines(path)
        if lines is None:
            continue
        check_big_file(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-layout.py", run))
