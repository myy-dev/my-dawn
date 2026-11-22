"""Exit non-zero unless an audit JSON saved by lab.putJson has no failures.

Usage: python3 tools/check_audit.py review/lab/<name>.json
"""
import json
import sys

report = json.load(open(sys.argv[1]))
failures = {key: report[key] for key in ("errors", "seams", "slowFrames", "slowCreate", "nondeterministic") if report[key]}
print(f"{len(report['times'])} scenes, failures: {failures or 'none'}")
sys.exit(1 if failures else 0)
