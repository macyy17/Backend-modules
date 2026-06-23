#!/usr/bin/env python3
"""
map.py — print a project's layer map.

Walks a directory tree, detects each file's layer from its path, and
prints a grouped summary showing which files belong to each layer.

Usage:
    python3 map.py src/
    python3 map.py src/ --counts    # only show file counts per layer

Exit codes:
    0  Always (informational output)
    2  Bad invocation
"""

from __future__ import annotations

import os
import sys
from collections import defaultdict

from _common import CODE_EXTS, detect_layer, expand_paths, file_ext


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        sys.stderr.write("usage: map.py DIR [--counts]\n")
        return 2

    counts_only = "--counts" in argv
    args = [a for a in argv[1:] if not a.startswith("--")]

    paths = expand_paths(args)
    layers: dict[str, list[str]] = defaultdict(list)
    unknown: list[str] = []

    for path in paths:
        if file_ext(path) not in CODE_EXTS:
            continue
        layer = detect_layer(path)
        if layer:
            layers[layer].append(path)
        else:
            unknown.append(path)

    # Print order
    order = [
        "transport", "application", "domain", "utils",
        "infrastructure", "contract", "test-support",
        "examples", "scripts", "tests",
    ]

    total = sum(len(v) for v in layers.values()) + len(unknown)
    print(f"Layer map — {total} source file(s)\n")

    for layer in order:
        files = layers.get(layer, [])
        if not files:
            continue
        print(f"  {layer} ({len(files)} files)")
        if not counts_only:
            for f in sorted(files):
                print(f"    {f}")
        print()

    if unknown:
        print(f"  (unclassified) ({len(unknown)} files)")
        if not counts_only:
            for f in sorted(unknown):
                print(f"    {f}")
        print()

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
