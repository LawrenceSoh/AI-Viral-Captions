"""Thumbnail rendering (1280x720 JPEG)."""
from __future__ import annotations
from pathlib import Path

from .config import Brand
from . import brand as brandmod


def make_thumbnail(brand: Brand, big_text: str, kicker: str,
                   out_jpg: Path, base_image: Path | None = None) -> Path:
    img = brandmod.render_thumbnail(brand, big_text, kicker, base_image)
    out_jpg = Path(out_jpg)
    out_jpg.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_jpg, quality=90)
    return out_jpg
