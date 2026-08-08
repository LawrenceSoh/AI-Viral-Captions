#!/usr/bin/env python3
"""One-command pipeline: topic -> finished draft video + thumbnail + metadata.

    python run.py --topic "5 AI tools for a solo accounting firm"
    python run.py --topic "..." --upload        # also push a PRIVATE draft to YouTube

Providers come from config.yaml (offline stub/piper by default). Output lands in
output/<slug>/ ready for the human review-and-publish step.
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
from pathlib import Path

from pipeline.config import load_config, Brand, OUTPUT
from pipeline import llm, voice, visuals, assemble, thumbnail
from pipeline import brand as brandmod

PILLAR = brandmod.PILLAR
SHORT = brandmod.SHORT


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60] or "video"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", default="5 AI tools that run a one-person accounting firm")
    ap.add_argument("--upload", action="store_true", help="push a private draft to YouTube")
    ap.add_argument("--format", choices=["pillar", "short"], default=None)
    args = ap.parse_args()

    cfg = load_config()
    brand = Brand.from_config(cfg)
    prov = cfg["providers"]
    # env overrides let CI / secrets flip providers without editing config.yaml
    import os
    prov["llm"] = os.environ.get("PROVIDER_LLM", prov["llm"])
    prov["voice"] = os.environ.get("PROVIDER_VOICE", prov["voice"])
    fmt = args.format or cfg["video"]["format"]
    size = PILLAR if fmt == "pillar" else SHORT
    fps = int(cfg["video"]["fps"])

    print(f"▸ Topic: {args.topic}")
    print(f"▸ Providers: llm={prov['llm']} voice={prov['voice']} | format={fmt}")

    # 1) Script + metadata
    plan = llm.generate_plan(args.topic, provider=prov["llm"])
    print(f"▸ Title: {plan.title}  ({len(plan.segments)} segments)")

    slug = slugify(plan.title)
    outdir = OUTPUT / slug
    work = outdir / "work"
    if outdir.exists():
        shutil.rmtree(outdir)
    work.mkdir(parents=True, exist_ok=True)

    # 2) Per-segment: voice + visual -> segment clip
    seg_clips = []
    first_capture = None
    for i, seg in enumerate(plan.segments):
        print(f"  segment {i+1}/{len(plan.segments)} [{seg.kind}] …")
        wav = work / f"seg{i}.wav"
        voice.synth(seg.narration, wav, provider=prov["voice"])

        base_png = None
        if seg.kind == "section":
            shot = work / f"shot{i}.png"
            captured = bool(seg.capture_url) and visuals.capture_url(seg.capture_url, shot)
            if captured:
                base_png = shot
            else:
                # designed concept panel (login-gated tool, or offline sandbox)
                name, _, prop = (seg.tool_label or "").partition("—")
                panel = brandmod.render_tool_panel(
                    brand, name.strip() or "AI tool", seg.capture_url,
                    prop.strip() or seg.narration[:70])
                base_png = work / f"panel{i}.png"
                panel.save(base_png)
            first_capture = first_capture or base_png
        clip = assemble.build_segment(seg, wav, base_png, brand, size, fps, work, i)
        seg_clips.append(clip)

    # 3) Concatenate to final
    final = outdir / f"{slug}.mp4"
    assemble.concat_segments(seg_clips, final, fps)
    print(f"▸ Video: {final}")

    # 4) Thumbnail
    thumb = outdir / "thumbnail.jpg"
    thumbnail.make_thumbnail(brand, plan.thumbnail_text, plan.thumbnail_kicker,
                             thumb, base_image=first_capture)
    print(f"▸ Thumbnail: {thumb}")

    # 5) Metadata + script (for the human review step)
    (outdir / "metadata.json").write_text(json.dumps({
        "title": plan.title, "description": plan.description,
        "tags": plan.tags, "made_for_kids": False,
    }, indent=2))
    (outdir / "plan.json").write_text(plan.to_json())

    # tidy intermediate frames but keep the wavs/shots for inspection
    for p in work.glob("*.png"):
        p.unlink()
    for p in work.glob("*.txt"):
        p.unlink()

    print("\n✅ Draft ready for review:")
    print(f"   {final}")
    print(f"   {thumb}")
    print(f"   {outdir/'metadata.json'}")

    if args.upload:
        from pipeline.upload import upload_draft
        upload_draft(str(final), plan.title, plan.description, plan.tags, str(thumb))


if __name__ == "__main__":
    main()
