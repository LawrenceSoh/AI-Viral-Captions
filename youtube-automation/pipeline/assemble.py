"""Assembly (ffmpeg).

Per segment: narration wav (known duration) + a base visual, over which we show
caption phrases timed to the voice. Segments are concatenated into the final
video with a gentle fade in/out. Fully deterministic, offline.
"""
from __future__ import annotations
import wave
import subprocess
from pathlib import Path

from PIL import Image

from .config import find_ffmpeg, Brand
from . import brand as brandmod
from .llm import Segment

FF = find_ffmpeg()


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def _run(args: list[str]) -> None:
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def split_captions(text: str, max_words: int = 7) -> list[str]:
    """Break narration into short on-screen phrases."""
    import re
    parts, cur = [], []
    for tok in re.findall(r"\S+", text):
        cur.append(tok)
        if len(cur) >= max_words or tok.endswith((".", ",", ";", ":", "—")):
            parts.append(" ".join(cur))
            cur = []
    if cur:
        parts.append(" ".join(cur))
    # merge a dangling 1-2 word tail into the previous phrase
    if len(parts) >= 2 and len(parts[-1].split()) <= 2:
        parts[-2] += " " + parts.pop()
    return parts


def _weighted_durations(phrases: list[str], total: float, fps: int) -> list[float]:
    weights = [max(1, len(p)) for p in phrases]
    s = sum(weights)
    raw = [total * w / s for w in weights]
    # round to whole frames, keep >= 0.5s each
    return [max(0.5, round(d * fps) / fps) for d in raw]


def build_segment(seg: Segment, narration: Path, base_png: Path | None,
                  brand: Brand, size, fps: int, workdir: Path, idx: int) -> Path:
    workdir.mkdir(parents=True, exist_ok=True)
    dur = wav_duration(narration)

    frames: list[tuple[Path, float]] = []
    if seg.kind in ("hook", "cta"):
        img = brandmod.render_frame(brand, title=seg.title or seg.narration,
                                    subtitle=("UP NEXT" if seg.kind == "cta" else None),
                                    size=size)
        fp = workdir / f"seg{idx}_0.png"
        img.save(fp)
        frames.append((fp, dur))
    else:
        phrases = split_captions(seg.narration)
        durs = _weighted_durations(phrases, dur, fps)
        for i, (ph, d) in enumerate(zip(phrases, durs)):
            img = brandmod.render_frame(brand, caption=ph, base_image=base_png,
                                        tool_label=seg.tool_label, size=size)
            fp = workdir / f"seg{idx}_{i}.png"
            img.save(fp)
            frames.append((fp, d))

    # concat-demuxer list (last entry repeated per ffmpeg spec)
    listfile = workdir / f"seg{idx}.txt"
    with open(listfile, "w") as fh:
        for fp, d in frames:
            fh.write(f"file '{fp.resolve()}'\nduration {d:.3f}\n")
        fh.write(f"file '{frames[-1][0].resolve()}'\n")

    out = workdir / f"seg{idx}.mp4"
    _run(["-f", "concat", "-safe", "0", "-i", str(listfile),
          "-i", str(narration),
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(fps),
          "-fps_mode", "cfr", "-c:a", "aac", "-ar", "44100",
          "-shortest", str(out)])
    return out


def concat_segments(segments: list[Path], out_path: Path, fps: int) -> Path:
    workdir = out_path.parent
    listfile = workdir / "segments.txt"
    with open(listfile, "w") as fh:
        for s in segments:
            fh.write(f"file '{s.resolve()}'\n")
    joined = workdir / "_joined.mp4"
    _run(["-f", "concat", "-safe", "0", "-i", str(listfile),
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(fps),
          "-c:a", "aac", "-ar", "44100", str(joined)])

    # total duration for fade-out
    total = _probe_duration(joined)
    _run(["-i", str(joined),
          "-vf", f"fade=t=in:st=0:d=0.4,fade=t=out:st={max(0,total-0.5):.2f}:d=0.5",
          "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(fps),
          "-c:a", "aac", "-movflags", "+faststart", str(out_path)])
    return out_path


def _probe_duration(mp4: Path) -> float:
    r = subprocess.run([FF, "-hide_banner", "-i", str(mp4)],
                       stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    for line in r.stderr.decode(errors="ignore").splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0
