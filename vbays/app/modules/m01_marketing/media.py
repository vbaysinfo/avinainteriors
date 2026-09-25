"""Media library: bring in real photos/videos and check them.

Sources: the Google Drive folder, photos/videos sent to the Telegram bot,
and uploads on the website. Each file is checked (Claude vision when an API
key is set, simple image checks otherwise) and poor or private shots are
rejected so they never get posted.
"""
import io
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps, ImageStat
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import ai
from app.modules.m01_marketing.models import MediaAsset
from app.modules.m01_marketing.video import probe_duration, video_frame

log = logging.getLogger(__name__)

PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".3gp", ".webm"}
ROOM_TYPES = ["kitchen", "wardrobe", "bedroom", "living", "dining", "tv_unit", "pooja", "bathroom", "office",
              "shop", "false_ceiling", "factory", "exterior", "other"]


def media_root() -> Path:
    d = get_settings().storage_dir / "media"
    d.mkdir(parents=True, exist_ok=True)
    return d


def abs_path(asset: MediaAsset) -> Path:
    return get_settings().storage_dir / asset.path


def kind_for(filename: str, mime: str | None = None) -> str | None:
    ext = Path(filename).suffix.lower()
    if ext in PHOTO_EXT or (mime or "").startswith("image/"):
        return "photo"
    if ext in VIDEO_EXT or (mime or "").startswith("video/"):
        return "video"
    return None


def ingest(db: Session, source: str, source_id: str, src_file: Path, filename: str, project: str | None = None,
           uploaded_by_id: int | None = None, move: bool = True) -> MediaAsset | None:
    """Add a file to the library (skips files already added)."""
    existing = db.scalar(select(MediaAsset).where(MediaAsset.source == source, MediaAsset.source_id == source_id))
    if existing:
        return None
    kind = kind_for(filename)
    if not kind:
        return None
    asset = MediaAsset(source=source, source_id=source_id, filename=filename[:300], path="", kind=kind,
                       project_name=project, uploaded_by_id=uploaded_by_id)
    db.add(asset)
    db.flush()
    rel = Path("media") / f"{asset.id:06d}{Path(filename).suffix.lower() or '.jpg'}"
    target = get_settings().storage_dir / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    (shutil.move if move else shutil.copyfile)(str(src_file), str(target))
    asset.path = str(rel)
    try:
        if kind == "photo":
            with Image.open(target) as im:
                im = ImageOps.exif_transpose(im)
                asset.width, asset.height = im.size
        else:
            asset.duration = probe_duration(target)
    except Exception as exc:
        asset.status, asset.reject_reason = "rejected", f"Could not open file: {exc}"
    return asset


# ---------------------------------------------------------------------------
# Quality check
# ---------------------------------------------------------------------------


class MediaCheck(BaseModel):
    room_type: str = Field(description=f"one of: {', '.join(ROOM_TYPES)}")
    style: str = Field(description="e.g. modern, contemporary, minimal, traditional, luxury, industrial, other")
    stage: str = Field(description="before, during, after, factory, or other")
    quality_score: int = Field(description="1 (unusable) to 10 (magazine quality) for social media")
    description: str = Field(description="one short sentence describing what is visible")
    tags: list[str] = Field(description="5-10 short tags, e.g. 'L-shaped kitchen', 'acrylic shutters'")
    has_people: bool = Field(description="true if any person or face is visible")
    has_private_info: bool = Field(
        description="true if a house/flat number, name board, vehicle plate, document or family photo is readable")
    usable: bool = Field(description="false if blurry, too dark, badly cluttered, or not interior/factory work")
    reject_reason: str = Field(description="why not usable, empty if usable")


def _preview_jpeg(asset: MediaAsset) -> bytes | None:
    path = abs_path(asset)
    if asset.kind == "video":
        frame = path.with_suffix(".frame.jpg")
        if not video_frame(path, frame):
            return None
        path = frame
    try:
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((1024, 1024))
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=85)
            return buf.getvalue()
    except Exception:
        return None


def _basic_check(jpeg: bytes, asset: MediaAsset) -> tuple[bool, str, int]:
    """Without AI: reject tiny, very dark or very blurry photos."""
    im = Image.open(io.BytesIO(jpeg)).convert("L")
    if asset.kind == "photo" and min(asset.width or 0, asset.height or 0) < 600:
        return False, "Photo is too small (needs at least 600 px).", 2
    brightness = ImageStat.Stat(im).mean[0]
    if brightness < 45:
        return False, "Photo is too dark.", 3
    edges = ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).var[0]
    if edges < 40:
        return False, "Photo looks blurry.", 3
    return True, "", 6


def check_asset(db: Session, asset: MediaAsset) -> MediaAsset:
    if asset.status == "rejected" and asset.reject_reason:
        return asset
    jpeg = _preview_jpeg(asset)
    if not jpeg:
        asset.status, asset.reject_reason = "rejected", "Could not read the photo/video."
        return asset
    ok, reason, score = _basic_check(jpeg, asset)
    if not ok:
        asset.status, asset.reject_reason, asset.quality_score = "rejected", reason, score
        return asset
    try:
        r: MediaCheck = ai.ask_json(
            db,
            "Check this photo from our interior projects/factory for use on Instagram and YouTube. "
            + (f"The staff note says: '{asset.project_name}'. " if asset.project_name else "")
            + "Be strict: only clean, well-lit, sharp shots of finished work, work in progress or our factory "
              "are usable.",
            MediaCheck, images=[(jpeg, "image/jpeg")], max_tokens=2000, use_knowledge=False,
        )
        asset.room_type = r.room_type if r.room_type in ROOM_TYPES else "other"
        asset.style, asset.stage = r.style[:40], r.stage[:20]
        asset.quality_score = max(1, min(10, r.quality_score))
        asset.description, asset.tags = r.description, r.tags[:10]
        asset.has_people, asset.has_private_info = r.has_people, r.has_private_info
        if not r.usable or asset.quality_score < 5:
            asset.status, asset.reject_reason = "rejected", r.reject_reason or "Low quality for social media."
        elif r.has_private_info:
            asset.status, asset.reject_reason = "rejected", "Shows private details (house number / name / plate)."
        else:
            asset.status = "ok"
    except ai.AIUnavailable:
        asset.status, asset.quality_score = "ok", score
        asset.room_type = asset.room_type or _guess_room(asset)
        asset.description = asset.description or (asset.project_name or asset.filename)
    return asset


def _guess_room(asset: MediaAsset) -> str:
    text = f"{asset.filename} {asset.project_name or ''}".lower()
    for rt in ROOM_TYPES:
        if rt.replace("_", " ") in text or rt in text:
            return rt
    return "other"


def usable_for_auto(asset: MediaAsset) -> bool:
    """May this file be posted without a human looking at it?"""
    return asset.status == "ok" and not asset.has_private_info and (not asset.has_people or asset.consent_ok)


def check_new(db: Session, limit: int = 30) -> int:
    n = 0
    for a in db.scalars(select(MediaAsset).where(MediaAsset.status == "new").limit(limit)):
        check_asset(db, a)
        n += 1
    return n


def scan_drive(db: Session) -> str:
    from app.integrations import connections, google

    folder = get_settings().google_drive_folder_id
    if not folder or not connections.get(db, "google"):
        return "Google Drive not connected"
    added = 0
    tmp = media_root() / "incoming"
    for f in google.drive_list(db, folder):
        if db.scalar(select(MediaAsset.id).where(MediaAsset.source == "drive", MediaAsset.source_id == f["id"])):
            continue
        if int(f.get("size") or 0) > 500 * 1024 * 1024:
            continue  # skip files over 500 MB
        target = tmp / f"{f['id']}{Path(f['name']).suffix.lower()}"
        google.drive_download(db, f["id"], target)
        if ingest(db, "drive", f["id"], target, f["name"], project=f.get("project")):
            added += 1
    return f"{added} new files from Drive"


def mark_used(db: Session, ids: list[int]) -> None:
    for a in db.scalars(select(MediaAsset).where(MediaAsset.id.in_(ids))):
        a.times_used += 1
        a.last_used_at = datetime.now(timezone.utc)
