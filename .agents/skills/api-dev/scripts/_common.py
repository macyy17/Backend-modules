#!/usr/bin/env python3
"""Shared helpers for api-dev check scripts."""

from __future__ import annotations

import os
import re
import sys
from typing import Iterable

# -------
# Config
# -------

CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"}

VENDOR_PREFIXES_CONTROLLER = (
    "Express", "Fastify", "Koa", "Nest", "Hapi",
)

# -------
# Helpers
# -------

class Finding:
    __slots__ = ("path", "line", "severity", "rule", "message")

    def __init__(self, path: str, line: int, severity: str, rule: str, message: str):
        self.path = path
        self.line = line
        self.severity = severity
        self.rule = rule
        self.message = message

    def emit(self) -> str:
        return f"{self.path}:{self.line}: [{self.severity}] [{self.rule}] {self.message}"


def read_lines(path: str) -> list[str] | None:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read().splitlines()
    except OSError:
        return None


def file_ext(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def basename_no_ext(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def norm(path: str) -> str:
    return path.replace("\\", "/")


def is_controller_file(path: str) -> bool:
    base = basename_no_ext(path)
    return base.endswith("Controller") or "/controllers/" in norm(path)


def is_route_file(path: str) -> bool:
    p = norm(path)
    return "/routes/" in p or basename_no_ext(path).endswith("Routes")


def is_middleware_file(path: str) -> bool:
    p = norm(path)
    return "/middlewares/" in p or "/middleware/" in p or basename_no_ext(path).endswith(("Middleware", "Guard"))


def expand_paths(args: Iterable[str], exts: set[str] | None = None) -> list[str]:
    if exts is None:
        exts = CODE_EXTS
    out: list[str] = []
    for a in args:
        if os.path.isdir(a):
            for root, _, files in os.walk(a):
                for name in files:
                    if file_ext(name) in exts:
                        out.append(os.path.join(root, name))
        else:
            out.append(a)
    return out


def run_checks(argv: list[str], script_name: str, check_fn, exts: set[str] | None = None) -> int:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {script_name} FILE [FILE ...]\n")
        return 2

    paths = expand_paths(argv[1:], exts)
    findings: list[Finding] = []
    check_fn(paths, findings)

    if not findings:
        print(f"OK: no {script_name.replace('.py', '').replace('check-', '')} issues found")
        return 0

    findings.sort(key=lambda f: (f.path, f.line, f.rule))
    for f in findings:
        print(f.emit())

    n_warn = sum(1 for f in findings if f.severity == "WARN")
    n_info = sum(1 for f in findings if f.severity == "INFO")
    print(f"\nSummary: {len(findings)} finding(s) — WARN={n_warn}, INFO={n_info}")
    return 1
