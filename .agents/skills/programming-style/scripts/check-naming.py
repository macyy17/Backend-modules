#!/usr/bin/env python3
"""
check-naming — naming convention rules.

Rules:
    vague-filename       WARN   file named helpers.ts, utils.py, types.ts, etc.
    vendor-named-service WARN   service named after a vendor (PgBossService)
    file-name-mismatch   WARN   file name does not match main exported symbol
    naming-case          WARN/INFO  wrong case for class/type/function
    vague-symbol         INFO   symbol contains Manager, Helper, Utils, etc.
"""

from __future__ import annotations

import os
import re
import sys

from _common import (
    KNOWN_POSTFIXES,
    SOURCE_EXTS,
    VAGUE_BASENAMES,
    VAGUE_TOKENS_IN_NAME,
    VENDOR_PREFIXES,
    Finding,
    basename_no_ext,
    file_ext,
    read_lines,
    run_checks,
)


def check_vague_filename(path: str, findings: list[Finding]) -> None:
    base = basename_no_ext(path).lower()
    if base in VAGUE_BASENAMES:
        findings.append(Finding(
            path, 1, "WARN", "vague-filename",
            f"'{os.path.basename(path)}' is vague — name files by responsibility",
        ))


def check_vendor_named_service(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = basename_no_ext(path)
    for prefix in VENDOR_PREFIXES:
        if base.startswith(prefix) and base.endswith("Service"):
            findings.append(Finding(
                path, 1, "WARN", "vendor-named-service",
                f"'{base}' names a service after a vendor — use a role name",
            ))
            return


def check_file_matches_export(path: str, lines: list[str], findings: list[Finding]) -> None:
    ext = file_ext(path)
    if ext not in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        return
    base = basename_no_ext(path)
    if base in {"index", "main"}:
        return
    pat = re.compile(
        r"^\s*export\s+(?:default\s+)?"
        r"(?:async\s+)?"
        r"(?:abstract\s+)?"
        r"(class|interface|type|enum|function|const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)"
    )
    first_export: tuple[int, str] | None = None
    for i, line in enumerate(lines, start=1):
        m = pat.match(line)
        if m:
            first_export = (i, m.group(2))
            break
    if first_export and first_export[1] != base:
        findings.append(Finding(
            path, first_export[0], "WARN", "file-name-mismatch",
            f"file '{base}' does not match exported '{first_export[1]}'",
        ))


def check_python_file_matches(path: str, lines: list[str], findings: list[Finding]) -> None:
    if file_ext(path) != ".py":
        return
    base = basename_no_ext(path)
    if base.startswith("_") or base in {"__init__", "__main__"}:
        return
    if any(re.match(r'^if\s+__name__\s*==\s*["\']__main__["\']\s*:', line) for line in lines):
        return
    if base.islower() or "_" in base:
        pat = re.compile(rf"^def\s+{re.escape(base)}\s*\(")
        for i, line in enumerate(lines, start=1):
            if pat.match(line):
                return
        any_def = re.compile(r"^(def|class)\s+([A-Za-z_][A-Za-z0-9_]*)")
        for i, line in enumerate(lines, start=1):
            m = any_def.match(line)
            if m:
                findings.append(Finding(
                    path, i, "WARN", "file-name-mismatch",
                    f"snake_case file '{base}' does not export function '{base}'",
                ))
                return


def check_naming_case(path: str, lines: list[str], findings: list[Finding]) -> None:
    ext = file_ext(path)
    if ext in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        class_pat = re.compile(r"^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)")
        type_pat = re.compile(r"^\s*(?:export\s+)?(?:type|interface)\s+([A-Za-z_][A-Za-z0-9_]*)")
        func_pat = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)")
        for i, line in enumerate(lines, start=1):
            for pat, kind, expected in (
                (class_pat, "class", "CapitalCase"),
                (type_pat, "type/interface", "CapitalCase"),
            ):
                m = pat.match(line)
                if m and not m.group(1)[0].isupper():
                    findings.append(Finding(
                        path, i, "WARN", "naming-case",
                        f"{kind} '{m.group(1)}' should be {expected}",
                    ))
            m = func_pat.match(line)
            if m and (m.group(1)[0].isupper() or "-" in m.group(1)):
                findings.append(Finding(
                    path, i, "INFO", "naming-case",
                    f"function '{m.group(1)}' should be snake_case or camelCase per project convention",
                ))
    elif ext == ".py":
        class_pat = re.compile(r"^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)")
        func_pat = re.compile(r"^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)")
        for i, line in enumerate(lines, start=1):
            m = class_pat.match(line)
            if m and not m.group(1)[0].isupper():
                findings.append(Finding(
                    path, i, "WARN", "naming-case",
                    f"class '{m.group(1)}' should be CapitalCase",
                ))
            m = func_pat.match(line)
            if m and any(c.isupper() for c in m.group(1)) and not m.group(1).startswith("_"):
                findings.append(Finding(
                    path, i, "WARN", "naming-case",
                    f"function '{m.group(1)}' should be snake_case",
                ))


def check_vague_symbols(path: str, lines: list[str], findings: list[Finding]) -> None:
    sym_pat = re.compile(
        r"^\s*(?:export\s+)?(?:abstract\s+)?(?:class|interface|type|function|const|def)\s+([A-Za-z_][A-Za-z0-9_]*)"
    )
    for i, line in enumerate(lines, start=1):
        m = sym_pat.match(line)
        if not m:
            continue
        name = m.group(1)
        for tok in VAGUE_TOKENS_IN_NAME:
            if tok in name and not name.endswith(KNOWN_POSTFIXES):
                findings.append(Finding(
                    path, i, "INFO", "vague-symbol",
                    f"'{name}' uses vague token '{tok}' — prefer a role-specific name",
                ))
                break


def run(paths: list[str], findings: list[Finding]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        check_vague_filename(path, findings)
        if file_ext(path) not in SOURCE_EXTS:
            continue
        lines = read_lines(path)
        if lines is None:
            continue
        check_vendor_named_service(path, lines, findings)
        check_file_matches_export(path, lines, findings)
        check_python_file_matches(path, lines, findings)
        check_naming_case(path, lines, findings)
        check_vague_symbols(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-naming.py", run))
