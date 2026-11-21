"""Regenerate the editable collection's looping stereo ambience as WAV."""
import json
from pathlib import Path
import wave

import numpy as np

from ambience import RATE, synthesize


ROOT = Path(__file__).resolve().parent
AUDIO_SECONDS = 24


if __name__ == "__main__":
    timeline = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
    destination = ROOT / "assets" / "audio"
    destination.mkdir(parents=True, exist_ok=True)
    for label in sorted({entry["sound"] for entry in timeline["scenes"]}):
        # The ambience intentionally contains no high-frequency content.
        samples = synthesize(label, AUDIO_SECONDS)[::2]
        with wave.open(str(destination / f"{label}.wav"), "wb") as output:
            output.setnchannels(2)
            output.setsampwidth(2)
            output.setframerate(RATE // 2)
            output.writeframes(np.round(samples * 32767).astype("<i2").tobytes())
