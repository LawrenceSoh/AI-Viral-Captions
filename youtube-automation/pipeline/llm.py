"""Script + metadata generation.

Returns a VideoPlan (title, description, tags, thumbnail text, ordered segments).
Providers:
  - stub    : offline, hand-seeded plan so the pipeline runs with zero API keys
  - gemini  : Google Gemini REST (needs GEMINI_API_KEY)  — cheap, good default
  - anthropic: Claude REST (needs ANTHROPIC_API_KEY)     — higher-quality scripts

Production swaps `providers.llm` in config.yaml. The structured-output contract
is identical across providers, so nothing downstream changes.
"""
from __future__ import annotations
import os
import json
from dataclasses import dataclass, field, asdict

import requests


@dataclass
class Segment:
    kind: str                 # "hook" | "section" | "cta"
    narration: str            # what the voice says
    title: str | None = None  # big card text (hook/cta) — no screenshot
    tool_label: str | None = None   # lower-third pill
    capture_url: str | None = None  # real UI to screenshot (Playwright)


@dataclass
class VideoPlan:
    title: str
    description: str
    tags: list[str]
    thumbnail_text: str
    thumbnail_kicker: str
    segments: list[Segment] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


# ── prompt used for real providers ────────────────────────────────────────
SYSTEM = (
    "You are a YouTube scriptwriter for a faceless channel about AI tools and "
    "systems for solo accountants and one-person businesses. Write tight, "
    "no-hype, useful scripts. Every video must add original analysis (a real "
    "opinion, a comparison, a concrete number) so it passes YouTube's "
    "inauthentic-content review. Return STRICT JSON only."
)

SCHEMA_HINT = """
Return JSON with this exact shape:
{
 "title": str (<=70 chars, curiosity + benefit),
 "description": str (2-3 sentences + 3 hashtags),
 "tags": [str, ... up to 12],
 "thumbnail_text": str (<=5 words, punchy),
 "thumbnail_kicker": str (<=2 words badge),
 "segments": [
   {"kind":"hook","title":str,"narration":str},
   {"kind":"section","narration":str,"tool_label":str,"capture_url":"https://..."},
   ... 3-6 sections ...
   {"kind":"cta","title":str,"narration":str}
 ]
}
The capture_url must be the tool's real public website homepage.
"""


def _seeded_plan(topic: str) -> VideoPlan:
    """A realistic, hand-written plan so the demo renders without any API key.
    In production this is what the LLM returns."""
    return VideoPlan(
        title="5 AI Tools That Run a One-Person Accounting Firm",
        description=(
            "The exact AI stack a solo accountant can use to replace a full back "
            "office — tested, with the real monthly cost. If you run your practice "
            "alone, start here. #soloaccountant #aitools #onepersonbusiness"
        ),
        tags=["ai for accountants", "solo accountant", "bookkeeping automation",
              "one person business", "ai bookkeeping", "accounting ai tools",
              "solopreneur", "small firm automation", "dext", "quickbooks ai"],
        thumbnail_text="Replace Your Back Office",
        thumbnail_kicker="Solo Firm",
        segments=[
            Segment(kind="hook",
                    title="5 AI tools that replace a $4,000/month back office",
                    narration="If you run an accounting practice on your own, you are "
                              "doing five jobs at once. These five AI tools each take "
                              "one of those jobs off your plate — here's the exact stack, "
                              "and what it really costs."),
            Segment(kind="section",
                    narration="First, data entry. Dext reads receipts, invoices and bank "
                              "statements, then categorises them automatically. This is the "
                              "forty to seventy percent of billable hours most solo firms "
                              "waste — gone.",
                    tool_label="Dext — receipt & invoice capture",
                    capture_url="https://dext.com"),
            Segment(kind="section",
                    narration="Second, the books themselves. QuickBooks now uses AI to "
                              "reconcile transactions and flag anomalies before they become "
                              "a month-end problem. For a one-person firm, that's your junior "
                              "bookkeeper, without the salary.",
                    tool_label="QuickBooks — AI reconciliation",
                    capture_url="https://quickbooks.intuit.com"),
            Segment(kind="section",
                    narration="Third, advisory. Digits turns your ledger into plain-English "
                              "reports clients actually read. You stop exporting spreadsheets "
                              "and start selling insight — the part clients pay a premium for.",
                    tool_label="Digits — AI reporting",
                    capture_url="https://digits.com"),
            Segment(kind="section",
                    narration="Here's the honest math. These tools run about ninety to a "
                              "hundred and fifty US dollars a month combined. A part-time "
                              "bookkeeper is two to four thousand. The gap is your margin — "
                              "and the whole point of a one-person company.",
                    tool_label="The real monthly cost",
                    capture_url=None),
            Segment(kind="cta",
                    title="Next: the AI client-onboarding system",
                    narration="Next week I'm building the AI client-onboarding system that "
                              "runs while you sleep. Subscribe so it lands in your feed."),
        ],
    )


def _gemini_plan(topic: str) -> VideoPlan:
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"parts": [{"text": f"Topic: {topic}\n{SCHEMA_HINT}"}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.8},
    }
    r = requests.post(url, json=body, timeout=90)
    r.raise_for_status()
    txt = r.json()["candidates"][0]["content"]["parts"][0]["text"]
    return _plan_from_json(txt)


def _anthropic_plan(topic: str) -> VideoPlan:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": key, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"},
        json={"model": "claude-sonnet-4-5", "max_tokens": 2000,
              "system": SYSTEM,
              "messages": [{"role": "user",
                            "content": f"Topic: {topic}\n{SCHEMA_HINT}\nReturn only JSON."}]},
        timeout=90,
    )
    r.raise_for_status()
    txt = r.json()["content"][0]["text"]
    return _plan_from_json(txt)


def _plan_from_json(txt: str) -> VideoPlan:
    txt = txt.strip()
    if txt.startswith("```"):
        txt = txt.split("```", 2)[1].lstrip("json").strip()
    data = json.loads(txt)
    segs = [Segment(**s) for s in data["segments"]]
    data["segments"] = segs
    return VideoPlan(**data)


def generate_plan(topic: str, provider: str = "stub") -> VideoPlan:
    if provider == "gemini":
        return _gemini_plan(topic)
    if provider == "anthropic":
        return _anthropic_plan(topic)
    return _seeded_plan(topic)
