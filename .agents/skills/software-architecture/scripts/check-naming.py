#!/usr/bin/env python3
"""
check-naming — postfix and naming consistency rules.

Rules:
    missing-postfix  INFO   file under controllers/ not ending in Controller, etc.
    worker-naming    INFO   worker file not ending in _worker
"""

from __future__ import annotations

import os
import sys

from _common import (
    CODE_EXTS,
    Finding,
    file_ext,
    norm,
    run_checks,
)


def check_postfix_consistency(path: str, findings: list[Finding]) -> None:
    p = norm(path)
    base = os.path.splitext(os.path.basename(path))[0]
    expectations = [
        ("/controllers/", "Controller"),
        ("/services/",    "Service"),
        ("/jobs/",        "Job"),
        ("/queues/",      "Queue"),
        ("/events/",      "Event"),
        ("/listeners/",   "Listener"),
        ("/middlewares/", ("Middleware", "Guard")),
        ("/middleware/",  ("Middleware", "Guard")),
        ("/repositories/", "Repository"),
    ]
    for seg, postfix in expectations:
        if seg in p:
            if base.lower() in {"index", "router", "routes"}:
                return
            if isinstance(postfix, tuple):
                if not base.endswith(postfix):
                    findings.append(Finding(
                        path, 1, "INFO", "missing-postfix",
                        f"file under {seg} should end with one of {postfix}",
                    ))
            else:
                if not base.endswith(postfix):
                    findings.append(Finding(
                        path, 1, "INFO", "missing-postfix",
                        f"file under {seg} should end with '{postfix}'",
                    ))
            return


def check_worker_naming(path: str, findings: list[Finding]) -> None:
    p = norm(path)
    if "/workers/" not in p:
        return
    base = os.path.splitext(os.path.basename(path))[0]
    if base in {"index"}:
        return
    if not base.endswith("_worker"):
        findings.append(Finding(
            path, 1, "INFO", "worker-naming",
            f"worker '{base}' should end with '_worker' (snake_case)",
        ))


def run(paths: list[str], findings: list[Finding]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        if file_ext(path) not in CODE_EXTS:
            continue
        check_postfix_consistency(path, findings)
        check_worker_naming(path, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-naming.py", run))
