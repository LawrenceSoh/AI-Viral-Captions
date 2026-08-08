"""Narration (text -> wav).

Providers:
  - piper     : offline neural TTS, zero cost (default; great for prototyping)
  - openai    : OpenAI TTS  (OPENAI_API_KEY)  ~$15 / 1M chars — cheap, natural
  - elevenlabs: ElevenLabs   (ELEVENLABS_API_KEY) — best quality, reserve for hero videos
"""
from __future__ import annotations
import os
import subprocess
from pathlib import Path

import requests

from .config import find_piper_voice


def synth(text: str, out_wav: Path, provider: str = "piper") -> Path:
    out_wav = Path(out_wav)
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    if provider == "openai":
        _openai(text, out_wav)
    elif provider == "elevenlabs":
        _elevenlabs(text, out_wav)
    else:
        _piper(text, out_wav)
    return out_wav


def _piper(text: str, out_wav: Path) -> None:
    voice = find_piper_voice()
    if not voice:
        raise RuntimeError("No piper voice in assets/voices/. See README (download step).")
    subprocess.run(
        ["piper", "--model", voice, "--output_file", str(out_wav)],
        input=text.encode("utf-8"), check=True,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def _openai(text: str, out_wav: Path) -> None:
    key = os.environ["OPENAI_API_KEY"]
    r = requests.post(
        "https://api.openai.com/v1/audio/speech",
        headers={"Authorization": f"Bearer {key}"},
        json={"model": "gpt-4o-mini-tts", "voice": "onyx", "input": text,
              "response_format": "wav"},
        timeout=120,
    )
    r.raise_for_status()
    out_wav.write_bytes(r.content)


def _elevenlabs(text: str, out_wav: Path) -> None:
    key = os.environ["ELEVENLABS_API_KEY"]
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=pcm_22050",
        headers={"xi-api-key": key, "content-type": "application/json"},
        json={"text": text, "model_id": "eleven_turbo_v2_5"},
        timeout=120,
    )
    r.raise_for_status()
    # wrap raw PCM into a wav container
    import wave
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(22050)
        w.writeframes(r.content)
