"""TEST-MODE demo: the whole marketing flow end to end with drawn sample pictures.

    python -m app.cli demo-marketing

Makes demo "room" pictures (clearly marked DEMO), adds them to the media
library, plans this week, makes a Reel, a carousel and a LinkedIn post,
"publishes" them (test mode, so only into the Outbox), and simulates
comments that turn into leads. Nothing is sent anywhere.
"""
import random
import tempfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from PIL import Image, ImageDraw
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import approvals, outbox
from app.core.models import ModuleSwitch, User
from app.modules.m01_marketing import engagement, media, planner, publisher
from app.modules.m01_marketing.models import ContentItem, MediaAsset, SocialPost
from app.modules.m01_marketing.textrender import draw_line

ROOMS = [
    ("kitchen", "after", (236, 228, 214), (68, 80, 84)),
    ("kitchen", "before", (205, 200, 190), (150, 140, 120)),
    ("wardrobe", "after", (240, 236, 228), (176, 141, 87)),
    ("tv_unit", "after", (232, 226, 216), (90, 70, 55)),
    ("bedroom", "after", (238, 232, 222), (120, 100, 80)),
    ("factory", "factory", (200, 204, 206), (110, 116, 120)),
    ("kitchen", "after", (244, 240, 232), (40, 60, 70)),
    ("living", "after", (236, 230, 220), (130, 110, 90)),
]


def _draw_room(kind: str, stage: str, wall, wood, seed: int) -> Image.Image:
    rnd = random.Random(seed)
    w, h = 1600, 1200
    im = Image.new("RGB", (w, h), wall)
    d = ImageDraw.Draw(im)
    d.rectangle((0, int(h * 0.78), w, h), fill=(170, 160, 150))  # floor
    for x in range(0, w, 120):
        d.line([(x, int(h * 0.78)), (x - 200, h)], fill=(150, 140, 130), width=3)
    if kind in ("kitchen", "factory"):
        for i in range(6):  # wall units
            x = 100 + i * 230
            d.rectangle((x, 120, x + 210, 420), fill=wood, outline=(30, 30, 30), width=4)
            d.rectangle((x + 95, 380, x + 115, 400), fill=(200, 200, 200))
        d.rectangle((60, 560, w - 60, 600), fill=(60, 60, 60))  # counter
        for i in range(6):  # base units
            x = 100 + i * 230
            d.rectangle((x, 600, x + 210, 920), fill=wood, outline=(30, 30, 30), width=4)
            d.rectangle((x + 20, 620, x + 190, 640), fill=(200, 200, 200))
        for x in range(60, w - 60, 60):  # tiles
            for y in range(430, 560, 45):
                d.rectangle((x, y, x + 56, y + 41), outline=(210, 205, 195), width=2)
    else:
        d.rectangle((250, 150, w - 250, 900), fill=wood, outline=(30, 30, 30), width=5)
        n = rnd.choice([3, 4, 5])
        step = (w - 500) // n
        for i in range(n):
            x = 250 + i * step
            d.rectangle((x + 8, 160, x + step - 8, 890), outline=(240, 230, 210), width=4)
            d.rectangle((x + step - 40, 500, x + step - 28, 580), fill=(220, 200, 150))
    if stage == "before":  # messy, dull
        for _ in range(40):
            x, y = rnd.randint(0, w), rnd.randint(0, h)
            d.ellipse((x, y, x + 60, y + 30), fill=(120, 110, 95))
    draw_line(d, 40, 30, f"DEMO {kind.replace('_', ' ').upper()} · {stage.upper()}", 48, (20, 20, 20), True)
    return im


def run(db: Session) -> dict:
    if not outbox.is_test_mode(db):
        raise RuntimeError("The demo only runs in TEST MODE.")
    sw = db.get(ModuleSwitch, "M01")
    sw.enabled, sw.test_mode = True, True
    tmp = Path(tempfile.mkdtemp())
    added = 0
    for i, (kind, stage, wall, wood) in enumerate(ROOMS):
        p = tmp / f"demo_{kind}_{stage}_{i}.jpg"
        _draw_room(kind, stage, wall, wood, i).save(p, "JPEG", quality=92)
        a = media.ingest(db, "demo", f"demo-{i}", p, p.name, project=f"Demo {kind} {stage}")
        if a:
            media.check_asset(db, a)
            a.room_type, a.stage = kind, stage  # demo labels are known
            if a.status != "ok":
                a.status = "ok"
            added += 1
    db.flush()

    week = planner.week_start_for(date.today())
    items = planner.plan_week(db, week) or list(db.scalars(select(ContentItem).where(ContentItem.week_start == week)))
    # make one of each kind now (normally this happens up to 2 days before posting)
    picked = {}
    for it in items:
        picked.setdefault(it.format, it)
    made = []
    for fmt in ("reel", "carousel", "linkedin_post"):
        it = picked.get(fmt)
        if it:
            it.scheduled_at = datetime.now(timezone.utc) - timedelta(minutes=1)
            for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id == it.id)):
                p.scheduled_at = it.scheduled_at
            publisher.produce(db, it)
            made.append(it)
    db.flush()
    # Without a Claude API key nothing is fact-checked, so everything asks the owner first.
    # For the demo, approve Instagram/YouTube as the owner; leave LinkedIn waiting on Telegram.
    owner = db.scalar(select(User).where(User.role == "owner", User.is_active.is_(True)))
    if owner:
        for it in made:
            for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id == it.id,
                                                         SocialPost.status == "awaiting_approval",
                                                         SocialPost.platform != "linkedin")):
                approvals.decide(db, p.approval_id, owner, "approve", note="demo", channel="system")
    for it in made:  # post right away instead of waiting for the scheduled minute
        for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id == it.id,
                                                     SocialPost.status == "scheduled")):
            p.scheduled_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.flush()
    published = publisher.publish_due(db)
    comments = [engagement.simulate(db, t) for t in (
        "Price for 2BHK full interiors in Madhurawada?",
        "Super kitchen 😍",
        "Very bad service, installation delayed 2 weeks",
        "ఈ కిచెన్ ఎంత అవుతుంది? మా ఇల్లు గాజువాకలో ఉంది",
    )]
    return {
        "media_added": added,
        "media_usable": len(list(db.scalars(select(MediaAsset.id).where(MediaAsset.status == "ok")))),
        "planned": len(items),
        "made": [f"#{it.id} {it.format}: {it.topic}" for it in made],
        "publish": published,
        "comments": [f"{c.intent} · lead={c.is_lead} · reply={c.reply_status}" for c in comments],
    }
