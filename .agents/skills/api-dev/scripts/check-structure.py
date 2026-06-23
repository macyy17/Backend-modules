#!/usr/bin/env python3
"""
check-structure — API file organization and naming rules.

Rules:
    vendor-named-controller  WARN   controller named after a vendor
    route-in-controller      INFO   route registration inside controller
    fat-route-handler        INFO   long inline handler in route file
    db-in-middleware          INFO   DB client used in middleware
    vague-method             INFO   controller method named handle/do/run/process
"""

from __future__ import annotations

import os
import re
import sys

from _common import (
    CODE_EXTS,
    VENDOR_PREFIXES_CONTROLLER,
    Finding,
    basename_no_ext,
    file_ext,
    is_controller_file,
    is_middleware_file,
    is_route_file,
    read_lines,
    run_checks,
)


def check_vendor_named_controller(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = basename_no_ext(path)
    for prefix in VENDOR_PREFIXES_CONTROLLER:
        if base.startswith(prefix) and base.endswith("Controller"):
            findings.append(Finding(
                path, 1, "WARN", "vendor-named-controller",
                f"'{base}' names a controller after a vendor — use role-based name",
            ))
            return


def check_route_in_controller(path: str, lines: list[str], findings: list[Finding]) -> None:
    if not is_controller_file(path):
        return
    pat = re.compile(r"\b(app|router|fastify)\.(get|post|put|patch|delete)\s*\(")
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            findings.append(Finding(
                path, i, "INFO", "route-in-controller",
                "route registration inside controller — register in routes/",
            ))
            return


def check_controller_in_route(path: str, lines: list[str], findings: list[Finding]) -> None:
    if not is_route_file(path):
        return
    text = "\n".join(lines)
    for m in re.finditer(
        r"\.(get|post|put|patch|delete)\(\s*[^,]+,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\}\)",
        text,
    ):
        body = m.group(2)
        if body.count("\n") > 10:
            line_no = text[: m.start()].count("\n") + 1
            findings.append(Finding(
                path, line_no, "INFO", "fat-route-handler",
                "long inline handler in route file — move logic to a controller/service",
            ))


def check_business_in_middleware(path: str, lines: list[str], findings: list[Finding]) -> None:
    if not is_middleware_file(path):
        return
    text = "\n".join(lines)
    if re.search(r"\b(prisma|sequelize|knex|typeorm|mongoose)\.", text, re.IGNORECASE):
        for i, line in enumerate(lines, start=1):
            if re.search(r"\b(prisma|sequelize|knex|typeorm|mongoose)\.", line, re.IGNORECASE):
                findings.append(Finding(
                    path, i, "INFO", "db-in-middleware",
                    "DB client used in middleware — keep persistence in services/repositories",
                ))
                return


def check_controller_naming_method(path: str, lines: list[str], findings: list[Finding]) -> None:
    if not is_controller_file(path):
        return
    vague = {"handle", "do", "run", "process", "exec", "main"}
    method_pat = re.compile(
        r"^\s*(?:public\s+|private\s+|protected\s+|async\s+)*([A-Za-z_][A-Za-z0-9_]*)\s*\(",
    )
    in_class = False
    for i, line in enumerate(lines, start=1):
        if re.search(r"\bclass\s+\w+Controller\b", line):
            in_class = True
        if not in_class:
            continue
        m = method_pat.match(line)
        if m and m.group(1) in vague:
            findings.append(Finding(
                path, i, "INFO", "vague-method",
                f"controller method '{m.group(1)}' is vague — use a verb that describes the action",
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
        check_vendor_named_controller(path, lines, findings)
        check_route_in_controller(path, lines, findings)
        check_controller_in_route(path, lines, findings)
        check_business_in_middleware(path, lines, findings)
        check_controller_naming_method(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-structure.py", run))
