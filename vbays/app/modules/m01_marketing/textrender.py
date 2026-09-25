"""Draw Telugu, English and Telugu-English mixed text on images (Pillow).

Telugu letters and English letters live in different font files, so each
word is drawn with the right font. Pillow's "raqm" layout joins Telugu
letters correctly.
"""
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT_DIR = Path(__file__).resolve().parents[2] / "assets" / "fonts"


def is_telugu(ch: str) -> bool:
    return "ఀ" <= ch <= "౿"


@lru_cache(maxsize=64)
def font(size: int, bold: bool = False, telugu: bool = False) -> ImageFont.FreeTypeFont:
    name = ("NotoSansTelugu" if telugu else "NotoSans") + ("-Bold" if bold else "-Regular") + ".ttf"
    return ImageFont.truetype(str(FONT_DIR / name), size)


def _runs(word: str) -> list[tuple[str, bool]]:
    """Split a word into runs of Telugu / non-Telugu characters."""
    runs: list[tuple[str, bool]] = []
    for ch in word:
        t = is_telugu(ch) or (ch in "‌‍" and runs and runs[-1][1])
        if runs and runs[-1][1] == t:
            runs[-1] = (runs[-1][0] + ch, t)
        else:
            runs.append((ch, t))
    return runs


def word_width(word: str, size: int, bold: bool) -> float:
    return sum(font(size, bold, t).getlength(r) for r, t in _runs(word))


def wrap(text: str, size: int, max_width: int, bold: bool = False) -> list[str]:
    lines: list[str] = []
    for para in text.split("\n"):
        line = ""
        for w in para.split():
            trial = f"{line} {w}".strip()
            if line and word_width(trial, size, bold) > max_width:
                lines.append(line)
                line = w
            else:
                line = trial
        lines.append(line)
    return [ln for ln in lines if ln] or [""]


def draw_line(draw: ImageDraw.ImageDraw, x: float, y: float, text: str, size: int, fill, bold=False) -> None:
    cx = x
    for r, t in _runs(text):
        f = font(size, bold, t)
        draw.text((cx, y), r, font=f, fill=fill)
        cx += f.getlength(r)


def fit_block(text: str, max_width: int, max_height: int, start_size: int, bold=True, min_size=28,
              line_gap=1.25) -> tuple[int, list[str]]:
    """Largest font size (≤ start_size) where the wrapped text fits the box."""
    size = start_size
    while size > min_size:
        lines = wrap(text, size, max_width, bold)
        if len(lines) * size * line_gap <= max_height:
            return size, lines
        size -= 4
    return min_size, wrap(text, min_size, max_width, bold)


def draw_block(img: Image.Image, text: str, box: tuple[int, int, int, int], start_size: int,
               fill=(255, 255, 255, 255), bold=True, align="center", bg=None, pad=28, line_gap=1.25) -> None:
    """Draw wrapped text inside box=(x, y, w, h), vertically centred, optional rounded background."""
    if not text.strip():
        return
    x, y, w, h = box
    size, lines = fit_block(text, w - 2 * pad, h - 2 * pad, start_size, bold, line_gap=line_gap)
    line_h = size * line_gap
    total = line_h * len(lines)
    widths = [word_width(ln, size, bold) for ln in lines]
    draw = ImageDraw.Draw(img, "RGBA")
    top = y + (h - total) / 2
    if bg:
        bw = max(widths) + 2 * pad
        bx = x + (w - bw) / 2 if align == "center" else x
        draw.rounded_rectangle((bx, top - pad * 0.6, bx + bw, top + total + pad * 0.4), radius=24, fill=bg)
    for i, ln in enumerate(lines):
        lx = x + (w - widths[i]) / 2 if align == "center" else x + pad
        draw_line(draw, lx, top + i * line_h, ln, size, fill, bold)
