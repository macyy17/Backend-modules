#!/usr/bin/env python3
"""
list-endpoints — Scan route files and print a table of all endpoints.

Detects Express/Fastify/Koa-style route registrations:
    router.get('/users', ...)
    app.post('/auth/login', ...)

Usage:
    python3 list-endpoints.py src/routes/
    python3 list-endpoints.py src/

Output:
    METHOD  PATH                    FILE
    GET     /users                  src/routes/users.ts:12
    POST    /auth/login             src/routes/auth.ts:25
    ...
"""

from __future__ import annotations

import os
import re
import sys

from _common import CODE_EXTS, expand_paths, file_ext, read_lines

ROUTE_PAT = re.compile(
    r"""\b(?:router|app|server|fastify|route)\."""
    r"""(get|post|put|patch|delete|head|options|all)"""
    r"""\s*\(\s*['"](/[^'"]*?)['"]""",
    re.IGNORECASE,
)

DECORATOR_PAT = re.compile(
    r"""@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['"](/[^'"]*?)['"]""",
)


def scan_file(path: str) -> list[tuple[str, str, str, int]]:
    """Return list of (method, path, file, line_no) tuples."""
    lines = read_lines(path)
    if lines is None:
        return []
    results = []
    for i, line in enumerate(lines, start=1):
        for m in ROUTE_PAT.finditer(line):
            method = m.group(1).upper()
            route_path = m.group(2)
            results.append((method, route_path, path, i))
        for m in DECORATOR_PAT.finditer(line):
            method = m.group(1).upper()
            route_path = m.group(2)
            results.append((method, route_path, path, i))
    return results


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        sys.stderr.write("usage: list-endpoints.py FILE [FILE ...]\n")
        return 2

    paths = expand_paths(argv[1:], CODE_EXTS)
    all_endpoints: list[tuple[str, str, str, int]] = []

    for path in paths:
        if not os.path.isfile(path):
            continue
        if file_ext(path) not in CODE_EXTS:
            continue
        all_endpoints.extend(scan_file(path))

    if not all_endpoints:
        print("No endpoints found.")
        return 0

    # Sort by path, then method
    all_endpoints.sort(key=lambda e: (e[1], e[0]))

    # Print table
    m_w = max(len(e[0]) for e in all_endpoints)
    p_w = max(len(e[1]) for e in all_endpoints)
    header_m = "METHOD".ljust(m_w)
    header_p = "PATH".ljust(p_w)
    print(f"{header_m}  {header_p}  FILE")
    print(f"{'─' * m_w}  {'─' * p_w}  {'─' * 30}")
    for method, route_path, fpath, line_no in all_endpoints:
        print(f"{method.ljust(m_w)}  {route_path.ljust(p_w)}  {fpath}:{line_no}")

    print(f"\nTotal: {len(all_endpoints)} endpoint(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
