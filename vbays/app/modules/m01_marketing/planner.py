"""The marketing brain: weekly plan → content package → fact check.

Every package follows the content rules: best format, 3-second hook, script,
on-screen text, caption, 15–20 hashtags (local + niche + broad), call to
action, best time, and YouTube SEO title/description/tags/chapters.

Only facts from the knowledge files are allowed. If Claude needs a fact it
does not have, it lists it in `missing_info`, and that piece is NOT posted
automatically. It goes to the owner on Telegram instead.
"""
import json
import logging
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import ai
from app.core.models import Setting
from app.modules.m01_marketing.media import usable_for_auto
from app.modules.m01_marketing.models import AnalyticsSnapshot, ContentItem, MediaAsset, SocialPost

log = logging.getLogger(__name__)

TEMPLATES = {
    "project_showcase": "Finished project walk-through (best photos/videos of one project)",
    "before_after": "Before → after transformation (needs a 'before' and an 'after' shot)",
    "factory_process": "How we make it in our own factory (cutting, edge banding, assembly, QC)",
    "tip_of_day": "One practical design/material tip",
    "cost_guide": "What affects the cost (materials, sizes, finishes); no invented prices",
    "material_comparison": "Compare two or three materials/finishes simply",
    "testimonial": "Happy customer story (only with consent)",
}
FORMATS = ["reel", "carousel", "post", "long_video", "linkedin_post"]
PLATFORMS_FOR_FORMAT = {
    "reel": ["instagram", "youtube"],  # Instagram Reel + YouTube Short
    "carousel": ["instagram"],
    "post": ["instagram"],
    "long_video": ["youtube"],
    "linkedin_post": ["linkedin"],
}


def setting(db: Session, key: str, default: str = "") -> str:
    s = db.get(Setting, key)
    return s.value if s and s.value is not None else default


def tz() -> ZoneInfo:
    return ZoneInfo(get_settings().timezone)


def week_start_for(d: date) -> date:
    return d - timedelta(days=d.weekday())  # Monday


# ---------------------------------------------------------------------------
# Structured output models
# ---------------------------------------------------------------------------


class PlanItem(BaseModel):
    day: int = Field(description="0=Monday … 6=Sunday")
    time: str = Field(description="posting time HH:MM (24h, India time)")
    template: str = Field(description=f"one of: {', '.join(TEMPLATES)}")
    format: str = Field(description=f"one of: {', '.join(FORMATS)}")
    topic: str
    language: str = Field(description="te, en or te-en")
    media_ids: list[int] = Field(description="ids of media to use, from the media list; empty for text-only tips")
    reason: str = Field(description="why this piece, this day and this time")


class WeekPlan(BaseModel):
    items: list[PlanItem]
    notes: str


class SceneOut(BaseModel):
    media_id: int | None = Field(description="media id for this scene, or null for a text card")
    on_screen_text: str = Field(description="max 6 words")
    voiceover: str = Field(description="one or two short spoken sentences, empty if none")
    seconds: float = Field(description="2.5 to 6")
    label: str = Field(description="'BEFORE', 'AFTER' or empty")


class SlideOut(BaseModel):
    media_id: int | None
    text: str


class YouTubeOut(BaseModel):
    title: str = Field(description="SEO title under 70 characters, include Vizag/Visakhapatnam where natural")
    description: str = Field(description="first 2 lines most important; include service + area keywords and CTA")
    tags: list[str] = Field(description="10-15 tags")
    chapters: list[str] = Field(description="'0:00 Intro' style lines; empty for Shorts")


class Package(BaseModel):
    hook: str = Field(description="first 3 seconds: words + what is shown")
    scenes: list[SceneOut] = Field(description="for reels/videos; 4-10 scenes, total under 80 seconds for reels")
    carousel_slides: list[SlideOut] = Field(description="for carousel (5-10) or post (1); empty otherwise")
    caption: str
    hashtags: list[str] = Field(description="15-20 hashtags: local Vizag + niche + broad, each starting with #")
    cta: str = Field(description="call to action, e.g. WhatsApp us for a free design consultation")
    best_time: str = Field(description="HH:MM India time")
    youtube: YouTubeOut
    linkedin_text: str = Field(description="professional LinkedIn post text (for linkedin_post format, else empty)")
    thumbnail_text: str = Field(description="3-6 bold words for the cover/thumbnail")
    facts_used: list[str] = Field(description="which knowledge files the facts came from")
    missing_info: list[str] = Field(description="facts you needed but were not in the knowledge files; empty if none")


class FactCheck(BaseModel):
    ok: bool = Field(description="true only if every claim is supported by the knowledge files")
    problems: list[str]


# ---------------------------------------------------------------------------
# Weekly plan
# ---------------------------------------------------------------------------


def _media_catalog(db: Session, limit: int = 120) -> list[MediaAsset]:
    assets = db.scalars(select(MediaAsset).where(MediaAsset.status == "ok")
                        .order_by(MediaAsset.times_used, MediaAsset.quality_score.desc().nullslast(),
                                  MediaAsset.id.desc()).limit(limit))
    return [a for a in assets if usable_for_auto(a)]


def targets(db: Session) -> dict[str, int]:
    return {
        "reel": int(setting(db, "ig_reels_per_week", "4")),
        "carousel": int(setting(db, "ig_carousels_per_week", "2")),
        "long_video": int(setting(db, "yt_long_videos_per_week", "1")),
        "linkedin_post": int(setting(db, "linkedin_posts_per_week", "2")),
    }


def plan_week(db: Session, week_start: date) -> list[ContentItem]:
    """Create next week's content items (skips if the week already has a plan)."""
    if db.scalar(select(ContentItem.id).where(ContentItem.week_start == week_start).limit(1)):
        return []
    media = _media_catalog(db)
    want = targets(db)
    lang = setting(db, "marketing_language", get_settings().default_language)
    try:
        plan = _ai_plan(db, week_start, media, want, lang)
    except ai.AIUnavailable as exc:
        log.info("Planning without AI: %s", exc)
        plan = _rule_plan(week_start, media, want, lang)
    items = []
    valid_ids = {a.id for a in media}
    for p in plan.items:
        fmt = p.format if p.format in FORMATS else "reel"
        tpl = p.template if p.template in TEMPLATES else "project_showcase"
        try:
            hh, mm = [int(x) for x in p.time.split(":")[:2]]
        except ValueError:
            hh, mm = 19, 30
        when = datetime.combine(week_start + timedelta(days=max(0, min(6, p.day))), time(hh % 24, mm % 60),
                                tzinfo=tz())
        item = ContentItem(week_start=week_start, scheduled_at=when, template=tpl, format=fmt, topic=p.topic[:500],
                           language=p.language if p.language in ("te", "en", "te-en") else lang,
                           platforms=PLATFORMS_FOR_FORMAT[fmt], media_ids=[i for i in p.media_ids if i in valid_ids],
                           reason=p.reason, status="planned")
        db.add(item)
        db.flush()
        for platform in item.platforms:
            db.add(SocialPost(content_item_id=item.id, platform=platform, status="waiting", scheduled_at=when))
        items.append(item)
    return items


def _ai_plan(db, week_start, media, want, lang) -> WeekPlan:
    catalog = [{"id": a.id, "type": a.kind, "room": a.room_type, "style": a.style, "stage": a.stage,
                "quality": a.quality_score, "used": a.times_used, "about": (a.description or "")[:120],
                "project": a.project_name} for a in media]
    insights = setting(db, "marketing_insights", "")
    recent = [s.data for s in db.scalars(select(AnalyticsSnapshot).order_by(AnalyticsSnapshot.day.desc()).limit(6))]
    prompt = f"""Plan our social media for the week starting Monday {week_start.isoformat()}.

Targets this week: {json.dumps(want)}  (reel = Instagram Reel + YouTube Short;
long_video = 16:9 YouTube video; linkedin_post = professional post for the owner's LinkedIn).
Default language: {lang}. Mix content types across: {json.dumps(TEMPLATES)}.
Rules: prefer our REAL media below; don't reuse heavily-used media; before_after needs a
'before' and an 'after' shot; spread posts across the week at the best local times for
Visakhapatnam audiences; LinkedIn posts are professional (factory capability, process,
quality, business milestones), not consumer-style.

Available media (JSON): {json.dumps(catalog)}
Last insights from analytics: {insights or 'none yet'}
Recent stats: {json.dumps(recent, default=str)[:3000]}"""
    return ai.ask_json(db, prompt, WeekPlan)


def _rule_plan(week_start, media, want, lang) -> WeekPlan:
    """Simple plan without AI: rotate templates and spread over the week."""
    by_room: dict[str, list[MediaAsset]] = {}
    for a in media:
        by_room.setdefault(a.room_type or "other", []).append(a)
    rooms = sorted(by_room, key=lambda r: -len(by_room[r])) or ["other"]
    rotation = ["project_showcase", "tip_of_day", "factory_process", "material_comparison", "cost_guide"]
    slots = [(0, "19:30"), (1, "13:00"), (2, "19:30"), (3, "18:30"), (4, "19:30"), (5, "11:30"), (6, "18:00")]
    items, k = [], 0
    for fmt in ("reel", "carousel", "long_video", "linkedin_post"):
        for _ in range(want.get(fmt, 0)):
            day, t = slots[k % 7]
            room = rooms[k % len(rooms)]
            tpl = "factory_process" if fmt == "linkedin_post" else rotation[k % len(rotation)]
            pool = by_room.get(room, [])
            ids = [a.id for a in pool[:6]] if tpl not in ("tip_of_day", "cost_guide") else [a.id for a in pool[:2]]
            topic = f"{TEMPLATES[tpl].split('(')[0].strip()}: {room.replace('_', ' ')}"
            items.append(PlanItem(day=day, time=t if fmt != "linkedin_post" else "10:00", template=tpl, format=fmt,
                                  topic=topic, language="en" if fmt == "linkedin_post" else lang, media_ids=ids,
                                  reason="Automatic rotation (AI not connected)"))
            k += 1
    return WeekPlan(items=items, notes="rule-based plan")


# ---------------------------------------------------------------------------
# Content package
# ---------------------------------------------------------------------------


def write_package(db: Session, item: ContentItem) -> tuple[dict, dict, bool]:
    """Returns (package, check, ai_used)."""
    media = list(db.scalars(select(MediaAsset).where(MediaAsset.id.in_(item.media_ids or []))))
    try:
        pkg = _ai_package(db, item, media)
        check = fact_check(db, pkg)
        return pkg.model_dump(), check.model_dump(), True
    except ai.AIUnavailable as exc:
        log.info("Writing without AI: %s", exc)
        return _rule_package(db, item, media).model_dump(), {"ok": False, "problems": ["AI not connected"]}, False


def _ai_package(db: Session, item: ContentItem, media: list[MediaAsset]) -> Package:
    catalog = [{"id": a.id, "type": a.kind, "room": a.room_type, "stage": a.stage, "about": a.description,
                "seconds": a.duration} for a in media]
    phone = setting(db, "business_phone", "")
    prompt = f"""Write the complete content package for this piece.

Format: {item.format}   Template: {item.template} ({TEMPLATES.get(item.template, '')})
Topic: {item.topic}
Language: {item.language} (te = natural spoken Telugu as used in Vizag; te-en = Telugu script with common English
words like kitchen, wardrobe, budget kept in English; en = simple English)
Platforms: {', '.join(item.platforms)}   Planned time: {item.scheduled_at.astimezone(tz()).strftime('%A %H:%M')}
Media you may use (JSON): {json.dumps(catalog)}
Contact for CTA: WhatsApp {phone or '[use the number from the knowledge files]'}

Rules:
- Hook must grab attention in the first 3 seconds.
- Use ONLY facts from the knowledge files. Never invent prices, timelines, warranty, offers, counts or
  customer names. If you need a fact that is not there, add it to missing_info.
- Never mention a customer's name or exact address.
- Hashtags: 15-20, mixing local (#Vizag #Visakhapatnam …), niche (#ModularKitchen …) and broad.
- For reel: scenes must use the media ids above (text cards allowed), total under 80 seconds.
- For carousel: 5-10 slides; for post: 1 slide; for long_video: 8-20 scenes and YouTube chapters.
- For linkedin_post: write linkedin_text (professional, 80-200 words, 3-5 hashtags), one slide for the image.
- YouTube title/description/tags are needed for reels (as Shorts) and long videos."""
    return ai.ask_json(db, prompt, Package)


def fact_check(db: Session, pkg: Package) -> FactCheck:
    text = json.dumps({"caption": pkg.caption, "scenes": [s.model_dump() for s in pkg.scenes],
                       "slides": [s.model_dump() for s in pkg.carousel_slides], "youtube": pkg.youtube.model_dump(),
                       "linkedin": pkg.linkedin_text}, ensure_ascii=False)
    return ai.ask_json(db, "Fact-check this social media content against the knowledge files. List every claim "
                           "(price, timeline, warranty, count, offer, material spec, award) that is NOT supported "
                           "by the knowledge files, and anything that looks unsafe to post publicly.\n\n" + text,
                       FactCheck, max_tokens=4000)


def _rule_package(db: Session, item: ContentItem, media: list[MediaAsset]) -> Package:
    """Safe, generic package without AI (contains no prices or promises)."""
    company = get_settings().company_name
    phone = setting(db, "business_phone", "")
    room = (media[0].room_type if media else "interiors") or "interiors"
    room_txt = {"tv_unit": "TV unit", "false_ceiling": "false ceiling", "other": "interiors"}.get(
        room, room.replace("_", " "))
    scenes = [SceneOut(media_id=a.id, on_screen_text=(a.stage or "").upper() if a.stage in ("before", "after")
                       else room_txt.title(), voiceover="", seconds=3.5,
                       label=(a.stage or "").upper() if a.stage in ("before", "after") else "") for a in media[:8]]
    if not scenes:
        scenes = [SceneOut(media_id=None, on_screen_text=item.topic[:40], voiceover="", seconds=4, label="")]
    slides = [SlideOut(media_id=a.id, text=room_txt.title() if i == 0 else "") for i, a in enumerate(media[:8])] \
        or [SlideOut(media_id=None, text=item.topic[:60])]
    cta = f"WhatsApp {phone} for a free design consultation" if phone else "Message us for a free design consultation"
    hashtags = ["#Vizag", "#Visakhapatnam", "#VizagInteriors", "#VizagHomes", "#AndhraPradesh",
                "#ModularKitchen", "#WardrobeDesign", "#ModularFurniture", "#FactoryDirect", "#InteriorDesign",
                "#HomeInterior", "#IndianHomes", "#HomeDecor", "#InteriorDesigner", "#DreamHome"]
    caption = f"{room_txt.title()} by {company}, designed and made in our own factory.\n\n{cta} ✨"
    return Package(
        hook=f"{room_txt.title()} transformation", scenes=scenes, carousel_slides=slides, caption=caption,
        hashtags=hashtags, cta=cta, best_time=item.scheduled_at.astimezone(tz()).strftime("%H:%M"),
        youtube=YouTubeOut(title=f"{room_txt.title()} Design | {company} Vizag"[:70],
                           description=f"{caption}\n\n{' '.join(hashtags[:8])}", tags=["interior design", "Vizag",
                           "modular kitchen", room_txt], chapters=[]),
        linkedin_text=(f"From design to our own factory floor: another {room_txt} completed by the {company} "
                       f"team in Visakhapatnam.\n\n#InteriorDesign #Manufacturing #Vizag"
                       if item.format == "linkedin_post" else ""),
        thumbnail_text=f"{room_txt.title()} Makeover", facts_used=[], missing_info=[],
    )


def auto_ok(item: ContentItem) -> bool:
    """May this item post without a human? Only if AI wrote it, it passed the fact check and
    nothing is missing."""
    pkg, chk = item.package or {}, item.check or {}
    return bool(pkg) and not pkg.get("missing_info") and bool(chk.get("ok"))
