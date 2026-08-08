"""Visual capture.

Real product footage is the channel's anti-slop moat: we screenshot the tool's
actual public website with a headless browser. If a site blocks/への times out,
the caller falls back to a branded concept card (see run.py) — so a failed
capture never breaks a render.
"""
from __future__ import annotations
from pathlib import Path


def capture_url(url: str, out_png: Path, viewport=(1600, 1000), timeout_ms=20000) -> bool:
    """Screenshot a public web page. Returns True on success."""
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--no-sandbox"])
            page = browser.new_page(viewport={"width": viewport[0], "height": viewport[1]},
                                    device_scale_factor=2)
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            page.wait_for_timeout(2500)          # let hero imagery/render settle
            _dismiss_cookies(page)
            page.wait_for_timeout(600)
            page.screenshot(path=str(out_png))   # above-the-fold, crisp
            browser.close()
        return out_png.exists() and out_png.stat().st_size > 0
    except Exception as e:  # network block, bot-wall, timeout — caller falls back
        print(f"  [visuals] capture failed for {url}: {e}")
        return False


def _dismiss_cookies(page) -> None:
    for label in ("Accept all", "Accept All", "I agree", "Accept", "Got it", "Allow all"):
        try:
            btn = page.get_by_role("button", name=label)
            if btn.count() > 0:
                btn.first.click(timeout=1500)
                return
        except Exception:
            continue
