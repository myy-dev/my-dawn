"""Move scenes out of a family file once they have their own sources/<id>.cjs.

Removes the family field from each timeline entry, the scene's entry from families/<family>.cjs (one or two
lines, starting at the line that names the id) and its row in the family's light table.

Usage: python3 tools/detach.py <family> <id> [<id> ...]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
family, ids = sys.argv[1], sys.argv[2:]
for id_ in ids:
    if not (ROOT / "sources" / f"{id_}.cjs").exists():
        sys.exit(f"sources/{id_}.cjs is missing")

timeline = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
for entry in timeline["scenes"]:
    if entry["id"] in ids:
        entry.pop("family", None)
(ROOT / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

path = ROOT / "families" / f"{family}.cjs"
lines = path.read_text(encoding="utf-8").split("\n")


def balance(text):
    return text.count("{") + text.count("[") + text.count("(") - text.count("}") - text.count("]") - text.count(")")


out, depth = [], 0
for line in lines:
    stripped = line.strip()
    if depth > 0:                      # inside an entry being removed: skip until its brackets close
        depth += balance(stripped)
        continue
    starts = [f"{{ id: '{i}'" for i in ids] + [f"{{id:'{i}'" for i in ids] + [f"['{i}'" for i in ids] \
        + [f"id: '{i}'" for i in ids] + [f"register('{i}'" for i in ids]
    if any(stripped.startswith(s) for s in starts) or any(re.match(rf"^{i}: \{{", stripped) for i in ids):
        depth = max(0, balance(stripped))
        continue
    out.append(line)
path.write_text("\n".join(out), encoding="utf-8")
print(f"detached {', '.join(ids)} from {family}")
