"""Visual style system (Pillow).

Every frame in every video is composited here, so the channel looks like one
consistent, premium explainer rather than random AI slop:

  ┌──────────────────────────────────────────┐
  │  CHANNEL NAME                 niche tag    │  header bar (brand primary)
  ├──────────────────────────────────────────┤
  │                                            │
  │        [ real tool screenshot ]            │  content area (framed)
  │                                            │
  │   ▸ Tool Name                              │  lower-third pill (accent)
  │  ┌──────────────────────────────────────┐ │
  │  │  large synced caption text           │ │  caption bar
  │  └──────────────────────────────────────┘ │
  └──────────────────────────────────────────┘
"""
from __future__ import annotations
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

from .config import Brand, hex_rgb, font_path

PILLAR = (1920, 1080)
SHORT = (1080, 1920)


def _font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(font_path(weight), size)


def _rounded(draw: ImageDraw.ImageDraw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def _text_wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _fit_contain(img: Image.Image, box_w: int, box_h: int) -> Image.Image:
    r = min(box_w / img.width, box_h / img.height)
    return img.resize((max(1, int(img.width * r)), max(1, int(img.height * r))), Image.LANCZOS)


def render_frame(
    brand: Brand,
    caption: str = "",
    base_image: Path | None = None,
    tool_label: str | None = None,
    title: str | None = None,
    subtitle: str | None = None,
    size=PILLAR,
) -> Image.Image:
    """Composite one finished frame. `title` renders a big centered title card
    (used for hooks / CTA); otherwise `base_image` is framed in the content area."""
    W, H = size
    bg = hex_rgb(brand.bg)
    primary = hex_rgb(brand.primary)
    accent = hex_rgb(brand.accent)
    text_c = hex_rgb(brand.text)
    muted = hex_rgb(brand.muted)
    vertical = H > W

    canvas = Image.new("RGB", size, bg)
    d = ImageDraw.Draw(canvas)

    # subtle brand gradient wash at the top for depth
    wash = Image.new("RGB", size, bg)
    wd = ImageDraw.Draw(wash)
    for y in range(H // 3):
        a = 1 - y / (H // 3)
        col = tuple(int(bg[i] + (primary[i] - bg[i]) * 0.25 * a) for i in range(3))
        wd.line([(0, y), (W, y)], fill=col)
    canvas = Image.blend(canvas, wash, 0.6)
    d = ImageDraw.Draw(canvas)

    pad = int(W * 0.045)
    header_h = int(H * (0.10 if vertical else 0.085))

    # ── header bar ────────────────────────────────────────────────────────
    d.rectangle([0, 0, W, header_h], fill=primary)
    d.rectangle([0, header_h, W, header_h + max(3, H // 300)], fill=accent)
    name_f = _font("bold", int(header_h * 0.42))
    d.text((pad, header_h / 2), brand.name, font=name_f, fill=text_c, anchor="lm")
    tag_f = _font("regular", int(header_h * 0.26))
    tag = "AI · one-person business"
    d.text((W - pad, header_h / 2), tag, font=tag_f, fill=(230, 240, 236), anchor="rm")

    # a section "chip" under the header (never collides with captions)
    chip_h = int(H * 0.062) if tool_label and title is None else 0
    if chip_h:
        cf2 = _font("bold", int(chip_h * 0.42))
        label = tool_label
        tw = d.textlength(label, font=cf2)
        cy = header_h + int(H * 0.028) + chip_h / 2
        _rounded(d, [pad, cy - chip_h / 2, pad + tw + 70, cy + chip_h / 2], 10, accent)
        d.text((pad + 24, cy), "▸", font=cf2, fill=hex_rgb(brand.bg), anchor="lm")
        d.text((pad + 52, cy), label, font=cf2, fill=hex_rgb(brand.bg), anchor="lm")

    content_top = header_h + int(H * 0.03) + chip_h
    content_bottom = H - int(H * (0.16 if not vertical else 0.13))

    if title is not None:
        # ── title / hook / CTA card ──────────────────────────────────────
        tf = _font("bold", int(W * (0.055 if not vertical else 0.075)))
        lines = _text_wrap(d, title, tf, W - 2 * pad)
        line_h = int(tf.size * 1.18)
        block_h = line_h * len(lines)
        y = (content_top + content_bottom) / 2 - block_h / 2
        # accent kicker
        if subtitle:
            kf = _font("bold", int(W * 0.026))
            kw = d.textlength(subtitle.upper(), font=kf)
            _rounded(d, [W / 2 - kw / 2 - 24, y - line_h - 30,
                         W / 2 + kw / 2 + 24, y - line_h + int(kf.size) + 10], 12, accent)
            d.text((W / 2, y - line_h + int(kf.size) / 2 - 8), subtitle.upper(),
                   font=kf, fill=hex_rgb(brand.bg), anchor="mm")
        for ln in lines:
            d.text((W / 2, y + line_h / 2), ln, font=tf, fill=text_c, anchor="mm")
            y += line_h
    elif base_image is not None and Path(base_image).exists():
        # ── framed screenshot / still ─────────────────────────────────────
        box_w = W - 2 * pad
        box_h = content_bottom - content_top - int(H * 0.06)
        img = Image.open(base_image).convert("RGB")
        img = _fit_contain(img, box_w, box_h)
        ix = int((W - img.width) / 2)
        iy = int(content_top + (box_h - img.height) / 2) + int(H * 0.01)
        # drop shadow
        shadow = Image.new("RGBA", size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle([ix - 6, iy - 6, ix + img.width + 6, iy + img.height + 6],
                             radius=18, fill=(0, 0, 0, 150))
        shadow = shadow.filter(ImageFilter.GaussianBlur(18))
        canvas.paste(Image.new("RGB", size, bg), (0, 0), Image.new("L", size, 0))
        canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB")
        d = ImageDraw.Draw(canvas)
        # rounded image
        mask = Image.new("L", img.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width, img.height], radius=16, fill=255)
        canvas.paste(img, (ix, iy), mask)
        d.rounded_rectangle([ix, iy, ix + img.width, iy + img.height], radius=16,
                            outline=accent, width=3)

    # ── caption bar ───────────────────────────────────────────────────────
    if caption:
        cf = _font("bold", int(W * (0.030 if not vertical else 0.045)))
        max_w = W - 2 * pad - 60
        lines = _text_wrap(d, caption, cf, max_w)
        line_h = int(cf.size * 1.22)
        box_h = line_h * len(lines) + 36
        by1 = H - box_h - int(H * 0.03)
        overlay = Image.new("RGBA", size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle([pad, by1, W - pad, by1 + box_h], radius=16, fill=(8, 12, 10, 210))
        canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
        d = ImageDraw.Draw(canvas)
        ty = by1 + 18
        for ln in lines:
            d.text((W / 2, ty + line_h / 2), ln, font=cf, fill=text_c, anchor="mm")
            ty += line_h

    return canvas


def render_tool_panel(brand: Brand, tool_name: str, url: str | None, value_prop: str,
                      size=(1500, 900)) -> Image.Image:
    """A designed 'browser window' concept slide — used when we can't (or
    shouldn't) screenshot the real UI (login-gated tools, or offline).
    Looks deliberate, not like a failed capture."""
    W, H = size
    bg = hex_rgb(brand.bg)
    primary = hex_rgb(brand.primary)
    accent = hex_rgb(brand.accent)
    text_c = hex_rgb(brand.text)
    muted = hex_rgb(brand.muted)
    img = Image.new("RGB", size, tuple(int(c * 0.6) for c in bg))
    d = ImageDraw.Draw(img)

    win = [40, 40, W - 40, H - 40]
    _rounded(d, win, 22, (245, 247, 246))
    # title bar
    bar_h = 78
    _rounded(d, [win[0], win[1], win[2], win[1] + bar_h + 22], 22, (225, 230, 228))
    d.rectangle([win[0], win[1] + bar_h - 6, win[2], win[1] + bar_h + 16], fill=(245, 247, 246))
    for i, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([win[0] + 34 + i * 34, win[1] + 30, win[0] + 52 + i * 34, win[1] + 48], fill=col)
    # url pill
    if url:
        dom = url.replace("https://", "").replace("http://", "").split("/")[0]
        uf = _font("regular", 30)
        uw = d.textlength(dom, font=uf)
        _rounded(d, [win[0] + 170, win[1] + 24, win[0] + 220 + uw, win[1] + 62], 19, (255, 255, 255))
        d.text((win[0] + 200, win[1] + 43), dom, font=uf, fill=(70, 80, 76), anchor="lm")

    # body: big tool name + value prop + skeleton UI
    body_x = win[0] + 60
    body_y = win[1] + bar_h + 60
    nf = _font("bold", 72)
    d.text((body_x, body_y), tool_name, font=nf, fill=hex_rgb(brand.primary))
    vf = _font("regular", 38)
    for j, ln in enumerate(_text_wrap(d, value_prop, vf, W - 200)[:2]):
        d.text((body_x, body_y + 96 + j * 50), ln, font=vf, fill=(90, 100, 96))
    # accent underline
    d.rectangle([body_x, body_y + 84, body_x + 120, body_y + 92], fill=accent)
    # skeleton rows to imply an app
    ry = body_y + 230
    for k in range(3):
        _rounded(d, [body_x, ry, W - 120, ry + 70], 14, (236, 240, 238))
        _rounded(d, [body_x + 20, ry + 20, body_x + 20 + 30, ry + 50], 8, accent)
        _rounded(d, [body_x + 70, ry + 26, body_x + 70 + (360 - k * 40), ry + 44], 9, (210, 216, 213))
        _rounded(d, [W - 260, ry + 22, W - 140, ry + 48], 9, hex_rgb(brand.primary))
        ry += 90
    return img


def render_thumbnail(brand: Brand, big_text: str, kicker: str, base_image: Path | None = None) -> Image.Image:
    """1280x720 thumbnail: bold left text, optional screenshot right."""
    W, H = 1280, 720
    bg = hex_rgb(brand.bg)
    primary = hex_rgb(brand.primary)
    accent = hex_rgb(brand.accent)
    canvas = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(canvas)
    # diagonal brand block on the right
    d.polygon([(W * 0.62, 0), (W, 0), (W, H), (W * 0.72, H)], fill=primary)
    if base_image and Path(base_image).exists():
        img = Image.open(base_image).convert("RGB")
        img = _fit_contain(img, int(W * 0.34), int(H * 0.6))
        canvas.paste(img, (int(W * 0.63), int(H * 0.2)))
    kf = _font("bold", 44)
    kw = d.textlength(kicker.upper(), font=kf)
    d.rounded_rectangle([60, 70, 60 + kw + 40, 70 + 64], radius=10, fill=accent)
    d.text((80, 102), kicker.upper(), font=kf, fill=hex_rgb(brand.bg), anchor="lm")
    tf = _font("bold", 96)
    lines = _text_wrap(d, big_text, tf, int(W * 0.55))[:3]
    y = 210
    for ln in lines:
        d.text((60, y), ln, font=tf, fill=hex_rgb(brand.text))
        y += int(tf.size * 1.05)
    d.text((60, H - 70), brand.name, font=_font("bold", 40), fill=accent, anchor="lm")
    return canvas
