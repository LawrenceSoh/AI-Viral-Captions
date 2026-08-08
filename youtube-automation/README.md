# One-Person Ledger — faceless YouTube automation pipeline

A code-orchestrated pipeline that turns a topic into a finished, review-ready
YouTube video: **script → voiceover → real tool footage → captions → assembled
MP4 → thumbnail → private-draft upload.** Built for the niche **"AI tools &
systems for solo accountants and one-person businesses."**

> Design principle: **AI does the labour, a human sets the angle and approves
> every video.** Nothing publishes automatically — the pipeline uploads *private
> drafts* so a human keeps the final say. This is what keeps the channel on the
> right side of YouTube's 2025 "inauthentic content" policy.

---

## What it produces
- **Pillar videos** — 16:9, 7–10 min (the money format; 8+ min unlocks mid-rolls)
- **Shorts** — 9:16, 30–50 s (the subscriber funnel) via `--format short`
- A **thumbnail** and **metadata.json** (title, description, tags) per video

Every frame is composited through one brand system (`pipeline/brand.py`) so the
channel looks like a consistent premium explainer, not random AI slop.

## Architecture
```
run.py                 orchestrator (topic -> finished draft)
pipeline/
  config.py            config.yaml loader, ffmpeg/voice/font resolver, Brand
  llm.py               script + metadata   (stub | gemini | anthropic)
  voice.py             text -> wav         (piper | openai | elevenlabs)
  visuals.py           Playwright capture of a tool's real public site
  brand.py             the visual style: frames, captions, concept panels, thumbs
  assemble.py          ffmpeg: per-segment clips -> concat -> fades -> loudnorm
  thumbnail.py         1280x720 thumbnail
  upload.py            YouTube Data API v3 — uploads as PRIVATE draft
```

## Quick start (fully offline — no API keys, no cost)
```bash
cd youtube-automation
pip install -r requirements.txt
python -m playwright install chromium     # for live tool capture
bash scripts/download_voice.sh            # offline neural voice (~120MB)

python run.py --topic "5 AI tools that run a one-person accounting firm"
# -> output/<slug>/<slug>.mp4  + thumbnail.jpg + metadata.json
```
Defaults use the `stub` script and offline `piper` voice, so this runs with zero
external calls. Swap in real providers when you're ready (below).

## Going live (providers)
Edit `config.yaml → providers` and set the matching key in `.env`:

| Stage | Cheap / default | Better | Best |
|-------|-----------------|--------|------|
| Script | `stub` (offline) → `gemini` (free tier) | `anthropic` (Claude) | — |
| Voice  | `piper` (offline, free) | `openai` (~$15/1M chars) | `elevenlabs` |
| Footage| Playwright capture (free) | + AI stills | + AI video (Kling/Veo) |

Cost lever, in order: **AI-video seconds ≫ premium TTS minutes ≫ LLM script
(pennies).** Start cheap; upgrade only the stage that's limiting quality.

## The human-in-the-loop steps (required — cannot be automated)
1. **One-time setup** — create the channel, claim the `@handle`, approve branding.
2. **Authorise upload** — Google Cloud project → enable *YouTube Data API v3* →
   OAuth *Desktop* client → save `client_secret.json` here → first `--upload`
   run opens a consent screen and caches `token.json`.
3. **Identity/monetisation** — ID check, AdSense, bank + tax, mailed PIN (later).
4. **Per batch (~weekly, 30–60 min):** review the private drafts, fact-check,
   pick the thumbnail, hit **Publish**.
5. **Ongoing:** reply to comments; monthly strategy review from analytics.
6. **Copyright:** handle any Content-ID/DMCA claim promptly (3 strikes = channel
   deleted). Use only cleared music (YouTube Audio Library).

## Scheduling
`.github/workflows/youtube-pipeline.yml` renders on a cron (Tue/Fri) and uploads
a private draft if YouTube credentials are present as repo secrets; otherwise it
saves the render as a downloadable artifact. Adjust the cron to your cadence.

## Notes / limits
- Live tool capture needs outbound web access + a real Chromium; in locked-down
  sandboxes it falls back to a **designed concept panel** (also used deliberately
  for login-gated tools). Never breaks a render.
- Set a real `channel.name` / `handle` in `config.yaml` before your first public
  upload so thumbnails and branding match from video #1.
- AI-disclosure: toggle YouTube's "altered/synthetic content" setting when a
  video uses realistic synthetic media (see YouTube's policy).
