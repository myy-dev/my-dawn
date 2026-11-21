"""Generate a seamless, quiet stereo ambience for each scene."""
import argparse
import wave
import zlib
from pathlib import Path

import numpy as np

RATE = 48_000


def synthesize(kind, seconds):
    count = round(seconds * RATE)
    frequency = np.fft.rfftfreq(count, 1 / RATE)
    angle = np.arange(count) * (2 * np.pi / count)
    rng = np.random.default_rng(zlib.crc32(kind.encode("ascii")))
    stereo = np.zeros((count, 2))

    def noise(low, high, tilt):
        spectrum = np.fft.rfft(rng.standard_normal(count))
        shape = (1 + (low / np.maximum(frequency, 1)) ** 8) ** -0.5
        shape *= (1 + (frequency / high) ** 8) ** -0.5
        shape *= (np.maximum(frequency, max(1, low)) / 150) ** tilt
        spectrum *= shape
        spectrum[0] = 0
        band = np.fft.irfft(spectrum, n=count)
        return band / band.std()

    def bed(level, low, high, tilt=-0.5, width=0.2, swell=1):
        mid = noise(low, high, tilt) * (level * swell)
        side = noise(low, high, tilt) * (level * width * swell)
        stereo[:, 0] += mid + side
        stereo[:, 1] += mid - side

    def events(number, level, low, high, length, ring=0):
        texture = noise(low, high, -0.2)
        for _ in range(number):
            start = rng.integers(0, count)
            duration = length * rng.uniform(0.55, 1.7)
            offset = np.arange(round(duration * RATE))
            time = offset / RATE
            attack = min(duration / 4, 0.018)
            envelope = (1 - np.exp(-time / attack)) * np.exp(-6.2 * time / duration)
            envelope *= np.sin(np.pi * np.minimum(1, (duration - time) / attack) / 2) ** 2
            indices = (start + offset) % count
            voice = texture[indices]
            if ring:
                pitch = ring * rng.uniform(0.83, 1.2)
                voice = 0.53 * voice + 0.65 * np.sin(2 * np.pi * pitch * time)
            voice = voice * envelope * level * rng.uniform(0.55, 1)
            pan = rng.uniform(-0.35, 0.35)
            stereo[indices, 0] += voice * (1 - pan)
            stereo[indices, 1] += voice * (1 + pan)

    if kind == "rain-room":
        bed(0.019, 110, 2000, width=0.28, swell=1 + 0.12 * np.sin(2 * angle + 0.7))
        bed(0.007, 310, 3800, width=0.37)
        events(230, 0.033, 350, 2200, 0.095, 790)
        events(19, 0.038, 170, 1100, 0.15, 410)
    elif kind == "rain-street":
        bed(0.019, 180, 4500, -0.4, 0.37, 1 + 0.1 * np.sin(3 * angle))
        bed(0.007, 52, 220, width=0.10, swell=1 + 0.22 * np.sin(angle + 1.6))
        events(360, 0.027, 460, 2900, 0.105)
        events(20, 0.050, 235, 2100, 0.17, 695)
    elif kind == "sea":
        wave_envelope = 0.69 + 0.20 * np.sin(4 * angle - 0.9) + 0.10 * np.sin(5 * angle + 0.5)
        bed(0.024, 40, 1000, -0.56, 0.29, wave_envelope)
        foam = (0.5 + 0.5 * np.sin(4 * angle - 1.75)) ** 1.7
        bed(0.012, 290, 2400, -0.46, 0.47, 0.36 + foam)
    elif kind == "record":
        bed(0.010, 76, 650, -0.52, 0.16)
        bed(0.005, 260, 2100, -0.30, 0.22, 0.92 + 0.07 * np.sin(3 * angle))
        events(52, 0.012, 280, 2300, 0.065)
    elif kind == "mechanism":
        bed(0.012, 52, 490, -0.52, 0.18, 0.93 + 0.06 * np.sin(2 * angle + 0.8))
        bed(0.003, 220, 1520, -0.40, 0.21)
        motor = np.sin(1376 * angle) + 0.16 * np.sin(2752 * angle + 0.52)
        stereo += (0.002 * motor * (0.92 + 0.06 * np.sin(angle)))[:, None]
    elif kind == "drips":
        bed(0.010, 64, 730, -0.56, 0.23, 0.94 + 0.05 * np.sin(2 * angle))
        bed(0.0025, 230, 1620, -0.34, 0.33)
        events(32, 0.018, 300, 1580, 0.19)
        events(8, 0.014, 160, 790, 0.26, 430)
    elif kind == "cascade":
        drift = 0.90 + 0.07 * np.sin(3 * angle - 0.8) + 0.03 * np.sin(5 * angle)
        bed(0.013, 61, 720, -0.62, 0.23, drift)
        bed(0.011, 270, 2250, -0.33, 0.42, 0.94 + 0.05 * np.sin(4 * angle + 1.1))
        events(38, 0.012, 270, 1980, 0.20)
    elif kind == "laundry":
        rhythm = 0.89 + 0.08 * np.sin(49 * angle + 0.12 * np.sin(3 * angle))
        bed(0.012, 39, 290, -0.53, 0.17, rhythm)
        bed(0.004, 270, 1830, -0.42, 0.35, 0.91 + 0.06 * np.sin(2 * angle))
        events(24, 0.008, 380, 1650, 0.12)
    elif kind == "fireworks":
        # Low surf with a soft, distant swell instead of a sharp impact.
        tide = 0.82 + 0.14 * np.sin(4 * angle - 0.85) + 0.08 * np.sin(5 * angle)
        bed(0.017, 56, 880, -0.55, 0.27, tide)
        shore = (0.5 + 0.5 * np.sin(4 * angle - 1.5)) ** 1.5
        bed(0.007, 270, 1850, -0.48, 0.43, 0.42 + 0.77 * shore)
    elif kind == "lake":
        swell = 0.86 + 0.12 * np.sin(5 * angle + 0.8) + 0.10 * np.sin(3 * angle)
        bed(0.016, 92, 1480, -0.54, 0.39, swell)
        bed(0.007, 52, 410, width=0.15, swell=1 + 0.18 * np.sin(angle))
        events(31, 0.026, 130, 920, 0.33)
    elif kind == "snow":
        bed(0.014, 85, 780, -0.56, 0.31, 0.83 + 0.14 * np.sin(2 * angle) + 0.10 * np.sin(5 * angle + 0.9))
        bed(0.004, 280, 2000, width=0.3, swell=1 + 0.25 * np.sin(3 * angle + 0.8))
    elif kind == "train":
        bed(0.019, 35, 270, -0.60, 0.18, 1 + 0.08 * np.sin(20 * angle))
        bed(0.011, 110, 1150, -0.53, 0.26, 0.92 + 0.10 * np.sin(4 * angle + 0.8))
        rail = (0.5 + 0.5 * np.sin(21 * angle + 0.10 * np.sin(angle))) ** 23
        bed(0.0065, 120, 420, -0.42, 0.21, rail)
    elif kind == "forest":
        bed(0.013, 160, 3200, -0.5, 0.39, 0.93 + 0.12 * np.sin(3 * angle - 0.9))
        bed(0.010, 60, 520, width=0.29, swell=1 + 0.14 * np.sin(5 * angle))
        events(114, 0.032, 330, 2350, 0.17, 910)
        events(16, 0.030, 180, 980, 0.32, 330)
    elif kind == "embers":
        bed(0.013, 90, 1250, -0.43, 0.30, 1 + 0.15 * np.sin(3 * angle))
        bed(0.007, 45, 280, width=0.17)
        events(104, 0.049, 175, 3100, 0.13)
        events(19, 0.067, 140, 1750, 0.25)
    elif kind == "wind":
        bed(0.017, 48, 570, -0.47, 0.37, 0.80 + 0.12 * np.sin(2 * angle - 1.5) + 0.11 * np.sin(3 * angle))
        bed(0.004, 380, 1750, width=0.46, swell=0.82 + 0.23 * np.sin(2 * angle - 0.2))
    elif kind == "leaves":
        # Wind in tree crowns: a low bed under a brighter rustle that rises with each gust.
        gust = 0.5 + 0.5 * np.sin(2 * angle - 1.1) * (0.8 + 0.2 * np.sin(5 * angle))
        bed(0.012, 50, 520, -0.5, 0.33, 0.82 + 0.15 * gust)
        bed(0.007, 650, 3400, -0.32, 0.52, 0.35 + 0.9 * gust ** 1.6)
        events(70, 0.009, 900, 3600, 0.08)
    elif kind == "grass":
        # Grass and reeds: softer, more even hiss with slow waves crossing the field.
        sway = 0.5 + 0.5 * np.sin(3 * angle + 0.4)
        bed(0.013, 55, 560, -0.5, 0.30, 0.86 + 0.10 * np.sin(2 * angle))
        bed(0.006, 480, 2700, -0.38, 0.48, 0.45 + 0.7 * sway ** 1.3)
        events(26, 0.006, 600, 2600, 0.14)
    elif kind == "gust":
        # Open heights and structures: deeper swells and a faint whistle that rides the gusts.
        swell = 0.66 + 0.24 * np.sin(2 * angle - 0.6) + 0.12 * np.sin(5 * angle + 1.2)
        bed(0.019, 38, 480, -0.55, 0.40, swell)
        bed(0.004, 360, 1600, width=0.5, swell=swell ** 2)
        whistle = np.sin(12480 * angle + 2.1 * np.sin(3 * angle))  # 520 Hz, whole cycles per loop
        stereo += (0.0016 * whistle * np.clip(swell - 0.62, 0, None) ** 1.5 / 0.4 ** 1.5)[:, None]
    elif kind == "sand":
        # Dunes: the wind bed plus a fine, dry hiss of moving grains.
        bed(0.014, 48, 560, -0.48, 0.35, 0.82 + 0.12 * np.sin(2 * angle - 1.2))
        drift = 0.5 + 0.5 * np.sin(2 * angle - 1.0)
        bed(0.0045, 1500, 5200, -0.2, 0.55, 0.3 + 0.8 * drift ** 2)
    elif kind == "room-wind":
        # Wind heard from indoors: muffled by the glass, over a low room tone.
        bed(0.015, 40, 300, -0.6, 0.18, 0.84 + 0.12 * np.sin(2 * angle - 1.5) + 0.06 * np.sin(3 * angle))
        bed(0.004, 30, 110, -0.7, 0.08)
        events(5, 0.006, 90, 420, 0.5)
    else:
        raise ValueError(f"Unknown ambience: {kind}")

    stereo -= stereo.mean(axis=0)
    rms = np.sqrt((stereo * stereo).mean())
    muted = {"snow", "wind", "lake", "fireworks", "record", "mechanism", "cascade", "laundry",
             "leaves", "grass", "gust", "sand"}
    target_dbfs = -34 if kind in {"drips", "room-wind"} else (-32 if kind in muted else -29)
    target = 10 ** (target_dbfs / 20)
    stereo = 0.19 * np.tanh(stereo * (target / rms / 0.19))
    # Taper the waveform at the browser audio loop boundary.
    edge = round(0.004 * RATE)
    ramp = np.sin(np.linspace(0, np.pi / 2, edge)) ** 2
    stereo[:edge] *= ramp[:, None]
    stereo[-edge:] *= ramp[::-1, None]
    return stereo


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("sound")
    parser.add_argument("seconds", type=float)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    samples = synthesize(args.sound, args.seconds)
    with wave.open(str(args.output), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(np.round(samples * 32767).astype("<i2").tobytes())
