"""Central configuration + resource location.

Loads config.yaml, resolves binary/asset paths, and exposes a Brand object.
Kept dependency-light on purpose so every other module imports from here.
"""
from __future__ import annotations
import os
import glob
import shutil
from dataclasses import dataclass
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent          # youtube-automation/
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "output"
CAPTURES = ASSETS / "captures"
VOICES = ASSETS / "voices"

for _d in (OUTPUT, CAPTURES, VOICES):
    _d.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    with open(ROOT / "config.yaml", "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


# ── ffmpeg ────────────────────────────────────────────────────────────────
def find_ffmpeg() -> str:
    """Prefer a full static build (H.264/AAC). Fall back to PATH."""
    env = os.environ.get("FFMPEG_BIN")
    if env and Path(env).exists():
        return env
    try:  # imageio-ffmpeg ships a full static ffmpeg
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    found = shutil.which("ffmpeg")
    if found:
        return found
    raise RuntimeError("No usable ffmpeg found. `pip install imageio-ffmpeg`.")


# ── piper voice model ─────────────────────────────────────────────────────
def find_piper_voice() -> str | None:
    env = os.environ.get("PIPER_VOICE")
    if env and Path(env).exists():
        return env
    hits = sorted(glob.glob(str(VOICES / "*.onnx")))
    return hits[0] if hits else None


# ── fonts ─────────────────────────────────────────────────────────────────
_FONT_CANDIDATES = {
    "bold": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ],
    "regular": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ],
}


def font_path(weight: str = "bold") -> str:
    for p in _FONT_CANDIDATES.get(weight, []):
        if Path(p).exists():
            return p
    # last resort: any ttf on the system
    for p in glob.glob("/usr/share/fonts/**/*.ttf", recursive=True):
        return p
    raise RuntimeError("No TrueType font found on system.")


@dataclass
class Brand:
    name: str
    handle: str
    niche: str
    primary: str
    accent: str
    bg: str
    text: str
    muted: str

    @staticmethod
    def from_config(cfg: dict) -> "Brand":
        b, c = cfg["brand"], cfg["channel"]
        return Brand(
            name=c["name"], handle=c["handle"], niche=c["niche"],
            primary=b["primary"], accent=b["accent"], bg=b["bg"],
            text=b["text"], muted=b["muted"],
        )


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore
