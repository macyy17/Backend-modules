#!/usr/bin/env python3
"""
check-security — API security rules.

Rules:
    leak-stack-trace        WARN   stack trace sent in HTTP response
    sql-injection-risk      WARN   SQL built via string concat with request data
    inline-secret           WARN   hardcoded-looking secret/token/key
    cors-wildcard-with-creds WARN  CORS '*' with credentials:true
    cors-wildcard           INFO   CORS allow-origin '*' without credentials
"""

from __future__ import annotations

import os
import re
import sys

from _common import CODE_EXTS, Finding, file_ext, read_lines, run_checks


def check_send_stack_trace(path: str, lines: list[str], findings: list[Finding]) -> None:
    patterns = [
        re.compile(r"\.json\s*\(\s*[^)]*\.stack\b"),
        re.compile(r"\.send\s*\(\s*[^)]*\.stack\b"),
        re.compile(r"res\.[^.]+\([^)]*\bstack\s*:"),
    ]
    for i, line in enumerate(lines, start=1):
        for pat in patterns:
            if pat.search(line):
                findings.append(Finding(
                    path, i, "WARN", "leak-stack-trace",
                    "stack trace sent in response — never expose to clients",
                ))
                break


def check_sql_concat(path: str, lines: list[str], findings: list[Finding]) -> None:
    sql_concat_req = re.compile(
        r"""(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|WHERE)\b[^\n]*\+\s*req\.""",
        re.IGNORECASE,
    )
    sql_template_req = re.compile(
        r"`[^`]*\b(SELECT|INSERT|UPDATE|DELETE|WHERE)\b[^`]*\$\{\s*req\.",
        re.IGNORECASE,
    )
    for i, line in enumerate(lines, start=1):
        if sql_concat_req.search(line) or sql_template_req.search(line):
            findings.append(Finding(
                path, i, "WARN", "sql-injection-risk",
                "SQL built by string concat with request data — use parameterized queries",
            ))


def check_inline_secret(path: str, lines: list[str], findings: list[Finding]) -> None:
    pat = re.compile(
        r"(api[_-]?key|secret|token|password|jwt[_-]?secret)\s*[:=]\s*[\"']([A-Za-z0-9_\-]{16,})[\"']",
        re.IGNORECASE,
    )
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            findings.append(Finding(
                path, i, "WARN", "inline-secret",
                "looks like a hardcoded secret — load from env",
            ))


def check_cors_wildcard(path: str, lines: list[str], findings: list[Finding]) -> None:
    pat = re.compile(
        r"""(Access-Control-Allow-Origin|origin)\s*[:=]\s*[\"']\*[\"']""",
        re.IGNORECASE,
    )
    creds_pat = re.compile(r"credentials\s*:\s*true", re.IGNORECASE)
    text = "\n".join(lines)
    has_creds = bool(creds_pat.search(text))
    for i, line in enumerate(lines, start=1):
        if pat.search(line):
            if has_creds:
                findings.append(Finding(
                    path, i, "WARN", "cors-wildcard-with-creds",
                    "CORS '*' with credentials:true is invalid and unsafe",
                ))
            else:
                findings.append(Finding(
                    path, i, "INFO", "cors-wildcard",
                    "CORS allow-origin '*' — restrict to known origins",
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
        check_send_stack_trace(path, lines, findings)
        check_sql_concat(path, lines, findings)
        check_inline_secret(path, lines, findings)
        check_cors_wildcard(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-security.py", run))
