#!/usr/bin/env python3
"""
check-layers — layer-boundary and import-direction rules.

Rules:
    layer-violation     WARN   a layer imports from a forbidden layer
    core-imports-infra  WARN   core/ file imports an infrastructure package
    core-reads-env      WARN   core/ file reads process.env / os.environ
    cross-module-import WARN   one module imports from a sibling module
    test-in-src         WARN   test file lives under src/
"""

from __future__ import annotations

import os
import re
import sys

from _common import (
    CODE_EXTS,
    FORBIDDEN_IMPORTS,
    Finding,
    detect_layer,
    detect_target_layer,
    file_ext,
    iter_imports,
    norm,
    read_lines,
    run_checks,
)


def check_layer_violations(path: str, lines: list[str], findings: list[Finding]) -> None:
    layer = detect_layer(path)
    if not layer:
        return
    forbidden = FORBIDDEN_IMPORTS.get(layer, set())
    if not forbidden:
        return
    for line_no, target in iter_imports(path, lines):
        target_layer = detect_target_layer(target, path)
        if target_layer in forbidden:
            findings.append(Finding(
                path, line_no, "WARN", "layer-violation",
                f"'{layer}' file imports from '{target_layer}' ({target}) — forbidden direction",
            ))


def check_core_no_infra(path: str, lines: list[str], findings: list[Finding]) -> None:
    p = norm(path)
    if "/core/" not in p:
        return
    bad_packages = (
        "express", "fastify", "koa", "hapi", "@nestjs",
        "pg", "mysql", "mysql2", "sqlite", "sqlite3",
        "mongodb", "mongoose", "prisma", "knex", "sequelize", "typeorm",
        "pg-boss", "bullmq", "bull", "amqplib", "ioredis", "redis",
        "axios", "node-fetch", "got", "undici",
        "aws-sdk", "@aws-sdk", "@google-cloud",
    )
    for line_no, target in iter_imports(path, lines):
        first = target.split("/", 1)[0]
        if first in bad_packages or target.startswith("@aws-sdk") or target.startswith("@google-cloud"):
            findings.append(Finding(
                path, line_no, "WARN", "core-imports-infra",
                f"core file imports infrastructure package '{target}' — keep core infra-free",
            ))


def check_env_in_core(path: str, lines: list[str], findings: list[Finding]) -> None:
    p = norm(path)
    if "/core/" not in p:
        return
    pat_js = re.compile(r"\bprocess\.env\b")
    pat_py = re.compile(r"\bos\.environ\b|\bos\.getenv\s*\(")
    for i, line in enumerate(lines, start=1):
        if pat_js.search(line) or pat_py.search(line):
            findings.append(Finding(
                path, i, "WARN", "core-reads-env",
                "core file reads environment variables — pass via parameters",
            ))


def check_cross_module_import(path: str, lines: list[str], findings: list[Finding]) -> None:
    p = norm(path)
    seg_re = re.compile(r"/(servers|services|tools|apps|packages)/([^/]+)/")
    m = seg_re.search(p)
    if not m:
        return
    my_kind, my_name = m.group(1), m.group(2)
    for line_no, target in iter_imports(path, lines):
        if not target.startswith(("../", "..\\")):
            continue
        full = norm(os.path.normpath(os.path.join(os.path.dirname(p), target)))
        m2 = seg_re.search("/" + full + "/")
        if m2 and (m2.group(1) != my_kind or m2.group(2) != my_name):
            findings.append(Finding(
                path, line_no, "WARN", "cross-module-import",
                f"module '{my_name}' imports from '{m2.group(2)}' — extract a shared package instead",
            ))


def check_test_in_src(path: str, lines: list[str], findings: list[Finding]) -> None:
    p = norm(path)
    if "/src/" not in p and not p.startswith("src/"):
        return
    base = os.path.basename(path)
    if base.endswith((".test.ts", ".test.js", ".spec.ts", ".spec.js", "_test.py", "_spec.py")):
        findings.append(Finding(
            path, 1, "WARN", "test-in-src",
            "test file lives under src/ — move to tests/",
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
        check_layer_violations(path, lines, findings)
        check_core_no_infra(path, lines, findings)
        check_env_in_core(path, lines, findings)
        check_cross_module_import(path, lines, findings)
        check_test_in_src(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-layers.py", run))
