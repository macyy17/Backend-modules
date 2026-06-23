#!/usr/bin/env python3
"""Shared helpers for programming-style check scripts."""

from __future__ import annotations

import os
import re
import sys
from typing import Iterable

# -------
# Config
# -------

VAGUE_BASENAMES = {
    "helpers", "helper", "utils", "util", "manager",
    "data", "common", "misc", "stuff", "things",
    "types", "type", "service", "controller", "job", "init",
}

VAGUE_TOKENS_IN_NAME = ("Manager", "Helper", "Utils", "Common", "Misc")

VENDOR_PREFIXES = (
    "PgBoss", "Axios", "Redis", "Mongo", "Postgres", "Mysql",
    "Sqlite", "Knex", "Sequelize", "TypeOrm", "Prisma",
    "Express", "Fastify", "Koa", "Nest", "Lodash",
)

KNOWN_POSTFIXES = (
    "Service", "Controller", "Middleware", "Guard", "Job", "Queue",
    "Event", "Listener", "Type", "Interface", "Request", "Response",
    "Result", "Config", "Repository",
)

SOURCE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"}

MAX_FILE_LINES = 500
MAX_FUNC_LINES = 80

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


def basename_no_ext(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def file_ext(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def expand_paths(args: Iterable[str]) -> list[str]:
    out: list[str] = []
    for a in args:
        if os.path.isdir(a):
            for root, _, files in os.walk(a):
                for name in files:
                    if file_ext(name) in SOURCE_EXTS:
                        out.append(os.path.join(root, name))
        else:
            out.append(a)
    return out


def run_checks(argv: list[str], script_name: str, check_fn) -> int:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {script_name} FILE [FILE ...]\n")
        return 2

    paths = expand_paths(argv[1:])
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
