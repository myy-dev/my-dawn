"""Build a local HTML player from Canvas scenes, timeline settings, and WAV loops."""
import argparse
from base64 import b64encode
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def data(path):
    return b64encode((ROOT / path).read_bytes()).decode("ascii")


def asset(path, id_):
    return f'<script id="{id_}" type="application/octet-stream">{data(path)}</script>'


def inline(source):
    return re.sub(r"</script", r"<\\/script", source, flags=re.IGNORECASE)


def js(value):
    return json.dumps(value, ensure_ascii=False)


def module(path):
    return "(() => {\nconst module = { exports: {} };\n" + read(path) + "\nreturn module.exports;\n})()"


def build(output):
    timing = read("timeline.json")
    entries = json.loads(timing)["scenes"]
    if not entries:
        raise ValueError("No scenes")

    ids = set()
    sounds = set()
    assets = []
    base_modules = []
    family_modules = {}
    for entry in entries:
        id_ = entry["id"]
        cycle = entry["cycleSeconds"]
        length = entry["durationSeconds"]
        sound = entry["sound"]
        family = entry.get("family")
        if (
            not isinstance(id_, str) or not re.fullmatch(r"[0-9]{2,3}", id_) or id_ in ids
            or type(cycle) not in (int, float) or not 0.1 <= cycle < float("inf")
            or (length is not None and (type(length) not in (int, float) or not 0.1 <= length < float("inf")))
            or not re.fullmatch(r"[a-z-]+", sound)
            or (family is not None and not re.fullmatch(r"[a-z-]+", family))
        ):
            raise ValueError(f"Invalid settings for scene {id_}")
        ids.add(id_)
        if family:
            if family not in family_modules:
                family_modules[family] = module(f"families/{family}.cjs")
        else:
            base_modules.append(f"{js(id_)}: {module(f'sources/{id_}.cjs')}")

        assets.append(asset(f"assets/stills/{id_}.jpg", f"still-{id_}"))
        if sound not in sounds:
            assets.append(asset(f"assets/audio/{sound}.wav", f"audio-{sound}"))
            sounds.add(sound)

    script = "const baseScenes = {\n" + ",\n".join(base_modules) + "\n};\n"
    script += "const sceneFamilies = {\n" + ",\n".join(
        f"{js(name)}: {source}" for name, source in family_modules.items()
    ) + "\n};\n"
    script += f"""const scenes = {js(entries)}.map(entry => {{
      const scene = entry.family
        ? sceneFamilies[entry.family].find(work => work.id === entry.id)
        : baseScenes[entry.id];
      if (!scene || scene.sound !== entry.sound) throw new Error('Invalid scene: ' + entry.id);
      return {{ ...entry, scene }};
    }});"""

    document = read("web/index.html")
    replacements = {
        "__DAWN_ICON__": "data:image/png;base64," + data("web/dawn.png"),
        "__SCENE_COUNT__": str(len(entries)),
        "/* STYLE */": read("web/style.css"),
        "<!-- ASSETS -->": "\n".join(assets),
        "/* SCENES */": inline(script),
        "/* PLAYER */": inline(read("web/player.js")),
    }
    for marker, replacement in replacements.items():
        document = document.replace(marker, replacement)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(document, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", nargs="?", type=Path, default=ROOT / "my-dawn-preview.html")
    build(parser.parse_args().output)
