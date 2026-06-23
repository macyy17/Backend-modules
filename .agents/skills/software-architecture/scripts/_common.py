#!/usr/bin/env python3
"""Shared helpers for software-architecture check scripts."""

from __future__ import annotations

import os
import re
import sys
from typing import Iterable

# -------
# Config
# -------

CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"}

# Layer detection from path segments. Order matters: more specific first.
LAYER_BY_SEGMENT = [
    ("controllers", "transport"),
    ("routes",       "transport"),
    ("middlewares",  "transport"),
    ("middleware",   "transport"),
    ("workers",      "transport"),
    ("services",     "application"),
    ("jobs",         "application"),
    ("queues",       "application"),
    ("events",       "application"),
    ("listeners",    "application"),
    ("repositories", "infrastructure"),
    ("database",     "infrastructure"),
    ("db",           "infrastructure"),
    ("providers",    "infrastructure"),
    ("core/utils",   "utils"),
    ("core",         "domain"),
    ("types",        "contract"),
    ("interfaces",   "contract"),
    ("samples",      "test-support"),
    ("examples",     "examples"),
    ("scripts",      "scripts"),
    ("tests",        "tests"),
]

# layer -> set of layers it is NOT allowed to import from
FORBIDDEN_IMPORTS = {
    "domain":         {"transport", "application", "infrastructure"},
    "utils":          {"transport", "application", "infrastructure", "domain"},
    "contract":       {"transport", "application", "infrastructure"},
    "infrastructure": {"transport", "application"},
    "application":    {"transport"},
    "tests":          set(),
    "scripts":        set(),
    "transport":      set(),
    "test-support":   set(),
    "examples":       set(),
}

GENERIC_DUMP_DIRS = {
    "utils", "helpers", "common", "misc", "shared", "stuff", "lib",
}

VAGUE_FILES = {
    "types.ts", "types.js", "types.py",
    "helpers.ts", "helpers.js", "helpers.py",
    "utils.ts", "utils.js", "utils.py",
    "common.ts", "common.js", "common.py",
    "index.ts", "index.js",
}

MAX_FILE_LINES = 500

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


def norm(path: str) -> str:
    return path.replace("\\", "/")


def detect_layer(path: str) -> str | None:
    p = norm(path)
    for seg, layer in LAYER_BY_SEGMENT:
        token = f"/{seg}/"
        if token in p:
            return layer
    return None


def detect_target_layer(import_target: str, current_file: str) -> str | None:
    t = import_target.replace("\\", "/")
    if not (t.startswith(".") or t.startswith("@/") or t.startswith("src/") or "/src/" in t):
        return None

    if t.startswith("."):
        base = os.path.dirname(current_file)
        candidate = norm(os.path.normpath(os.path.join(base, t)))
    elif t.startswith("@/"):
        candidate = "src/" + t[2:]
    else:
        candidate = t

    for seg, layer in LAYER_BY_SEGMENT:
        if f"/{seg}/" in f"/{candidate}/":
            return layer
    return None


# -------
# Import iteration
# -------

JS_IMPORT_PAT = re.compile(
    r"""^\s*(?:import\b[^'"]*from\s*|import\s*|export\s+\*\s+from\s*|export\s+\{[^}]*\}\s+from\s*)['"]([^'"]+)['"]"""
)
JS_REQUIRE_PAT = re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""")
PY_IMPORT_PAT = re.compile(r"^\s*(?:from\s+([\w.]+)\s+import\b|import\s+([\w.]+))")


def iter_imports(path: str, lines: list[str]):
    ext = file_ext(path)
    if ext == ".py":
        for i, line in enumerate(lines, start=1):
            m = PY_IMPORT_PAT.match(line)
            if m:
                target = m.group(1) or m.group(2)
                yield i, target.replace(".", "/")
    else:
        for i, line in enumerate(lines, start=1):
            m = JS_IMPORT_PAT.match(line)
            if m:
                yield i, m.group(1)
            else:
                m = JS_REQUIRE_PAT.search(line)
                if m:
                    yield i, m.group(1)


def expand_paths(args: Iterable[str]) -> list[str]:
    out: list[str] = []
    for a in args:
        if os.path.isdir(a):
            for root, _, files in os.walk(a):
                for name in files:
                    if file_ext(name) in CODE_EXTS:
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
