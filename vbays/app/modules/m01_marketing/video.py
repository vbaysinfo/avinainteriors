"""Video maker: turns real photos/videos + a script into finished videos.

- 9:16 (Reels / Shorts) and 16:9 (YouTube)
- slow zoom on photos, trimmed clips, smooth transitions (wipe for before/after)
- on-screen text + burned-in subtitles (Telugu / English / mixed)
- logo intro card and call-to-action outro card
- voiceover (free Microsoft Edge neural voices, optional) + background music
  (put royalty-free .mp3 files in storage/music/)
- thumbnails / covers and carousel images

Uses FFmpeg (bundled via imageio-ffmpeg) and Pillow.
"""
import asyncio
import logging
import random
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

from app.config import get_settings
from app.modules.m01_marketing.textrender import draw_block, draw_line, font

log = logging.getLogger(__name__)

FPS = 30
XFADE = 0.5
SIZES = {"vertical": (1080, 1920), "landscape": (1920, 1080), "portrait": (1080, 1350)}
SLATE, GOLD, IVORY = (68, 80, 84), (176, 141, 87), (250, 247, 242)
VOICES = {"te": "te-IN-ShrutiNeural", "te-en": "te-IN-ShrutiNeural", "en": "en-IN-NeerjaNeural"}
MAX_REEL_SECONDS = 88  # Instagram API accepts Reels of 5–90 s


class VideoError(Exception):
    pass


def ffmpeg_exe() -> str:
    s = get_settings()
    if s.ffmpeg_path:
        return s.ffmpeg_path
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run_ffmpeg(args: list[str]) -> None:
    proc = subprocess.run([ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y", *args],
                          capture_output=True, text=True)
    if proc.returncode != 0:
        raise VideoError(proc.stderr.strip()[-1500:] or "ffmpeg failed")


def probe_duration(path: Path) -> float:
    proc = subprocess.run([ffmpeg_exe(), "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", proc.stderr)
    if not m:
        return 0.0
    h, mnt, sec = m.groups()
    return int(h) * 3600 + int(mnt) * 60 + float(sec)


@dataclass
class Brand:
    company: str
    phone: str = ""
    website: str = ""
    tagline: str = ""
    logo: Path | None = None


@dataclass
class Scene:
    text: str = ""  # on-screen text
    voice: str = ""  # narration (also shown as subtitle)
    seconds: float = 3.5
    media: Path | None = None
    media_kind: str = "photo"  # photo / video / card
    label: str = ""  # e.g. BEFORE / AFTER
    audio: Path | None = None
    audio_len: float = 0.0
    extra: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Images (Pillow)
# ---------------------------------------------------------------------------


def cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(ImageOps.exif_transpose(img).convert("RGB"), size, Image.LANCZOS)


def brand_background(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, SLATE)
    d = ImageDraw.Draw(img)
    for i in range(h):  # soft vertical gradient
        t = i / h
        d.line([(0, i), (w, i)], fill=(int(68 - 25 * t), int(80 - 25 * t), int(84 - 22 * t)))
    d.rectangle((0, h - 14, w, h), fill=GOLD)
    return img


def scene_overlay(size, text: str, subtitle: str, label: str, brand: Brand) -> Image.Image:
    """Transparent layer with on-screen text (top), subtitle (bottom), label and small logo."""
    w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    vertical = h > w
    if text:
        box = (int(w * 0.06), int(h * (0.10 if vertical else 0.06)), int(w * 0.88), int(h * (0.22 if vertical else 0.26)))
        draw_block(layer, text, box, 84 if vertical else 76, bg=(20, 26, 28, 170))
    if subtitle:
        box = (int(w * 0.06), int(h * (0.70 if vertical else 0.74)), int(w * 0.88), int(h * (0.14 if vertical else 0.18)))
        draw_block(layer, subtitle, box, 50 if vertical else 46, bold=False, bg=(0, 0, 0, 150), line_gap=1.3)
    if label:
        d = ImageDraw.Draw(layer)
        f = font(56, True)
        tw = f.getlength(label)
        d.rounded_rectangle((40, 40, 40 + tw + 60, 40 + 90), radius=20, fill=GOLD + (235,))
        draw_line(d, 70, 52, label, 56, (255, 255, 255), True)
    _watermark(layer, brand)
    return layer


def _watermark(layer: Image.Image, brand: Brand) -> None:
    w, h = layer.size
    if brand.logo and brand.logo.exists():
        logo = Image.open(brand.logo).convert("RGBA")
        logo.thumbnail((int(w * 0.18), int(h * 0.08)))
        alpha = logo.getchannel("A").point(lambda a: int(a * 0.8))
        logo.putalpha(alpha)
        layer.alpha_composite(logo, (w - logo.width - 30, h - logo.height - 40))
    else:
        d = ImageDraw.Draw(layer)
        f = font(30, True)
        tw = f.getlength(brand.company)
        draw_line(d, w - tw - 36, h - 76, brand.company, 30, (255, 255, 255, 200), True)


def card_image(size, title: str, lines: list[str], brand: Brand, show_logo=True) -> Image.Image:
    """Brand-coloured card for intro / outro / tips without photos."""
    w, h = size
    img = brand_background(size).convert("RGBA")
    y = int(h * 0.18)
    if show_logo and brand.logo and brand.logo.exists():
        logo = Image.open(brand.logo).convert("RGBA")
        logo.thumbnail((int(w * 0.45), int(h * 0.14)))
        img.alpha_composite(logo, ((w - logo.width) // 2, y))
        y += logo.height + 40
    draw_block(img, title, (int(w * 0.07), y, int(w * 0.86), int(h * 0.30)), 96 if h > w else 88, fill=IVORY + (255,))
    y += int(h * 0.32)
    for ln in lines:
        if ln:
            draw_block(img, ln, (int(w * 0.07), y, int(w * 0.86), int(h * 0.08)), 52, fill=(230, 214, 184, 255),
                       bold=False)
            y += int(h * 0.085)
    return img.convert("RGB")


def thumbnail(size, photo: Path | None, text: str, brand: Brand, out: Path) -> Path:
    w, h = size
    if photo and photo.exists():
        img = cover(Image.open(photo), size).convert("RGBA")
        shade = Image.new("RGBA", size, (0, 0, 0, 0))
        d = ImageDraw.Draw(shade)
        for i in range(h):
            d.line([(0, i), (w, i)], fill=(0, 0, 0, int(170 * max(0, (i / h) - 0.35) / 0.65)))
        img.alpha_composite(shade)
    else:
        img = brand_background(size).convert("RGBA")
    draw_block(img, text, (int(w * 0.05), int(h * 0.55), int(w * 0.9), int(h * 0.38)), 120 if h > w else 110,
               fill=(255, 255, 255, 255), bg=None)
    d = ImageDraw.Draw(img)
    f = font(40, True)
    d.rectangle((0, 0, f.getlength(brand.company) + 60, 80), fill=GOLD + (240,))
    draw_line(d, 30, 14, brand.company, 40, (255, 255, 255), True)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out, "JPEG", quality=90)
    return out


def slide_images(slides: list[dict], brand: Brand, out_dir: Path, size=SIZES["portrait"]) -> list[Path]:
    """Carousel / single post images: photo + text, or brand card + text."""
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, s in enumerate(slides[:10]):
        photo: Path | None = s.get("path")
        if photo and photo.exists() and s.get("kind", "photo") == "photo":
            img = cover(Image.open(photo), size).convert("RGBA")
            img.alpha_composite(scene_overlay(size, s.get("text", ""), "", s.get("label", ""), brand))
        else:
            img = card_image(size, s.get("text", ""), [], brand, show_logo=(i == 0)).convert("RGBA")
            _watermark(img, brand)
        p = out_dir / f"slide_{i + 1:02d}.jpg"
        img.convert("RGB").save(p, "JPEG", quality=92)
        paths.append(p)
    return paths


def video_frame(path: Path, out: Path) -> Path | None:
    """Grab a still from a video (for thumbnails)."""
    try:
        run_ffmpeg(["-ss", "1", "-i", str(path), "-frames:v", "1", str(out)])
        return out
    except VideoError:
        return None


# ---------------------------------------------------------------------------
# Voiceover
# ---------------------------------------------------------------------------


def make_voice(text: str, language: str, out: Path) -> float:
    """Create an mp3 voice clip. Returns its length in seconds (0 if not available)."""
    if not text.strip() or not get_settings().voiceover_enabled:
        return 0.0
    try:
        import edge_tts

        async def _go():
            await edge_tts.Communicate(text, VOICES.get(language, VOICES["en"])).save(str(out))

        asyncio.run(_go())
        return probe_duration(out)
    except Exception as exc:  # no internet, service down … carry on without voice
        log.warning("Voiceover skipped: %s", exc)
        return 0.0


# ---------------------------------------------------------------------------
# Segments + assembly (FFmpeg)
# ---------------------------------------------------------------------------


def _render_segment(scene: Scene, size, brand: Brand, work: Path, idx: int) -> Path:
    w, h = size
    dur = scene.seconds
    frames = int(dur * FPS)
    overlay = work / f"ov_{idx}.png"
    scene_overlay(size, scene.text, scene.voice, scene.label, brand).save(overlay)
    out = work / f"seg_{idx}.mp4"
    enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-r", str(FPS), "-an"]

    if scene.media_kind == "video" and scene.media:
        vf = (f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={FPS},"
              f"tpad=stop_mode=clone:stop_duration={dur:.2f},trim=duration={dur:.2f},setsar=1[b];"
              f"[b][1:v]overlay=0:0[v]")
        run_ffmpeg(["-t", f"{dur:.2f}", "-i", str(scene.media), "-loop", "1", "-t", f"{dur:.2f}", "-i", str(overlay),
                    "-filter_complex", vf, "-map", "[v]", "-t", f"{dur:.2f}", *enc, str(out)])
        return out

    # photo or card → still image with slow zoom (Ken Burns)
    still = work / f"still_{idx}.jpg"
    if scene.media_kind == "photo" and scene.media:
        base = cover(Image.open(scene.media), (int(w * 1.5), int(h * 1.5)))
    else:
        base = card_image((int(w * 1.5), int(h * 1.5)), "", [], brand, show_logo=False)
    base.save(still, "JPEG", quality=92)
    zoom_in = idx % 2 == 0
    z = "min(zoom+0.0007,1.12)" if zoom_in else "if(eq(on,0),1.12,max(zoom-0.0007,1.0))"
    vf = (f"[0:v]zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={w}x{h}:fps={FPS},"
          f"setsar=1[b];[b][1:v]overlay=0:0[v]")
    run_ffmpeg(["-i", str(still), "-loop", "1", "-t", f"{dur:.2f}", "-i", str(overlay), "-filter_complex", vf,
                "-map", "[v]", "-frames:v", str(frames), *enc, str(out)])
    return out


def _card_segment(img: Image.Image, dur: float, work: Path, name: str) -> Path:
    still = work / f"{name}.jpg"
    img.save(still, "JPEG", quality=92)
    out = work / f"{name}.mp4"
    run_ffmpeg(["-loop", "1", "-t", f"{dur:.2f}", "-i", str(still), "-vf", f"fps={FPS},format=yuv420p",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-r", str(FPS), "-an", str(out)])
    return out


def _srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def make_video(scenes: list[Scene], orientation: str, brand: Brand, language: str, out: Path,
               template: str = "", cta: str = "", intro_title: str = "", max_seconds: float | None = None) -> dict:
    """Build the full video. Returns {"path", "srt", "duration"}."""
    size = SIZES[orientation]
    work = out.parent / f"work_{orientation}"
    work.mkdir(parents=True, exist_ok=True)
    if not scenes:
        raise VideoError("No scenes to render.")

    # 1) voiceover per scene, stretch scenes so the voice fits
    for i, sc in enumerate(scenes):
        if sc.voice:
            clip = work / f"voice_{i}.mp3"
            sc.audio_len = make_voice(sc.voice, language, clip)
            sc.audio = clip if sc.audio_len > 0 else None
        sc.seconds = max(2.5, min(12.0, sc.seconds, 12.0), sc.audio_len + 0.7)

    intro = card_image(size, intro_title or brand.company, [brand.tagline], brand)
    outro = card_image(size, cta or "Free design consultation", [brand.phone, brand.website], brand)
    durations = [2.0] + [sc.seconds for sc in scenes] + [3.5]

    # keep Reels inside Instagram's limit
    limit = max_seconds or 10_000
    while sum(durations) - XFADE * (len(durations) - 1) > limit and len(scenes) > 1:
        scenes.pop()
        durations = [2.0] + [sc.seconds for sc in scenes] + [3.5]

    # 2) render segments
    segs = [_card_segment(intro, 2.0, work, "intro")]
    segs += [_render_segment(sc, size, brand, work, i) for i, sc in enumerate(scenes)]
    segs.append(_card_segment(outro, 3.5, work, "outro"))

    # 3) join with transitions
    inputs: list[str] = []
    for s in segs:
        inputs += ["-i", str(s)]
    parts, prev, offset = [], "0:v", 0.0
    for k in range(1, len(segs)):
        offset += durations[k - 1] - XFADE
        is_after = template == "before_after" and k - 1 < len(scenes) and scenes[k - 1].label.upper() == "AFTER"
        trans = "wipeleft" if is_after else ("fade" if k in (1, len(segs) - 1) else "smoothleft")
        label = f"x{k}"
        parts.append(f"[{prev}][{k}:v]xfade=transition={trans}:duration={XFADE}:offset={offset:.2f}[{label}]")
        prev = label
    total = sum(durations) - XFADE * (len(segs) - 1)

    # 4) audio: voice clips at scene starts + music underneath
    starts, t = [], 2.0 - XFADE
    for sc in scenes:
        starts.append(t)
        t += sc.seconds - XFADE
    a_inputs, a_parts, mix = [], [], []
    n = len(segs)
    for sc, st in zip(scenes, starts):
        if sc.audio:
            a_inputs += ["-i", str(sc.audio)]
            ms = int((st + 0.3) * 1000)
            a_parts.append(f"[{n}:a]adelay={ms}|{ms},aresample=44100[a{n}]")
            mix.append(f"[a{n}]")
            n += 1
    music = _pick_music()
    if music:
        a_inputs += ["-stream_loop", "-1", "-i", str(music)]
        vol = 0.12 if mix else 0.35
        a_parts.append(f"[{n}:a]atrim=0:{total:.2f},volume={vol},afade=t=out:st={max(0, total - 2):.2f}:d=2,"
                       f"aresample=44100[a{n}]")
        mix.append(f"[a{n}]")
        n += 1
    if not mix:  # silent track (some platforms expect audio)
        a_inputs += ["-f", "lavfi", "-t", f"{total:.2f}", "-i", "anullsrc=r=44100:cl=stereo"]
        a_parts.append(f"[{n}:a]anull[a{n}]")
        mix.append(f"[a{n}]")
        n += 1
    a_parts.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=longest,"
                   f"atrim=0:{total:.2f}[aout]")

    fc = ";".join(parts + a_parts)
    out.parent.mkdir(parents=True, exist_ok=True)
    run_ffmpeg([*inputs, *a_inputs, "-filter_complex", fc, "-map", f"[{prev}]", "-map", "[aout]",
                "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
                "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", f"{total:.2f}", str(out)])

    # 5) subtitles file (.srt) from the narration
    srt = out.with_suffix(".srt")
    lines, k = [], 1
    for sc, st in zip(scenes, starts):
        if sc.voice:
            lines += [str(k), f"{_srt_time(st + 0.3)} --> {_srt_time(st + sc.seconds - 0.2)}", sc.voice, ""]
            k += 1
    srt.write_text("\n".join(lines), encoding="utf-8")
    return {"path": out, "srt": srt, "duration": round(total, 2)}


def _pick_music() -> Path | None:
    d = get_settings().storage_dir / "music"
    files = sorted(d.glob("*.mp3")) + sorted(d.glob("*.m4a")) if d.exists() else []
    return random.choice(files) if files else None
