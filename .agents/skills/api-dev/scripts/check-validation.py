#!/usr/bin/env python3
"""
check-validation — API input validation and response type rules.

Rules:
    unvalidated-input      INFO   request input used without obvious validator
    missing-response-type  INFO   controller has no *Response type
"""

from __future__ import annotations

import os
import re
import sys

from _common import CODE_EXTS, Finding, file_ext, is_controller_file, read_lines, run_checks


def check_unvalidated_body_use(path: str, lines: list[str], findings: list[Finding]) -> None:
    if not is_controller_file(path):
        return
    text = "\n".join(lines)
    body_access = re.search(r"\breq\.(body|query|params)\.[A-Za-z_]", text)
    if not body_access:
        return
    has_validator = any(
        kw in text
        for kw in (
            "zod", "yup", "joi", "class-validator", "ajv",
            "valibot", "pydantic", "marshmallow", "@nestjs/common",
            "ValidationPipe", "validate(", "schema.parse(", "Schema.parse(",
        )
    )
    if not has_validator:
        for i, line in enumerate(lines, start=1):
            if re.search(r"\breq\.(body|query|params)\.[A-Za-z_]", line):
                findings.append(Finding(
                    path, i, "INFO", "unvalidated-input",
                    "request input used without an obvious validator — validate at boundary",
                ))
                break


def check_missing_response_type(path: str, lines: list[str], findings: list[Finding]) -> None:
    if not is_controller_file(path):
        return
    if file_ext(path) not in {".ts", ".tsx"}:
        return
    text = "\n".join(lines)
    has_response_type = re.search(r"\b[A-Z][A-Za-z0-9_]*Response\b", text)
    if not has_response_type:
        findings.append(Finding(
            path, 1, "INFO", "missing-response-type",
            "no *Response type referenced — define and use typed responses",
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
        check_unvalidated_body_use(path, lines, findings)
        check_missing_response_type(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-validation.py", run))
