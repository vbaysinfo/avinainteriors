"""Marketing autopilot tests (TEST MODE, no real platforms, no AI key)."""
from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.core import approvals, outbox
from app.core.models import Lead, ModuleSwitch, OutboxMessage, Setting
from app.integrations import connections
from app.modules.m01_marketing import demo, engagement, planner, publisher
from app.modules.m01_marketing.models import ContentItem, MediaAsset, SocialComment, SocialPost
from app.modules.m01_marketing.textrender import wrap
from tests.conftest import make_user


@pytest.fixture(scope="module")
def demo_result():
    from app.core.db import session_scope

    with session_scope() as db:
        make_user(db, "owner", chat_id=424242)
    with session_scope() as db:
        return demo.run(db)


def test_demo_runs_end_to_end(demo_result):
    assert demo_result["media_usable"] >= 8
    assert demo_result["planned"] >= 5
    assert len(demo_result["made"]) == 3
    assert demo_result["publish"].startswith(("2", "3"))


def test_videos_and_images_are_made(db, demo_result):
    reel = db.scalar(select(ContentItem).where(ContentItem.format == "reel", ContentItem.video_path.isnot(None)))
    assert reel and publisher.storage(reel.video_path).stat().st_size > 50_000
    assert publisher.storage(reel.thumbnail_path).exists()
    car = db.scalar(select(ContentItem).where(ContentItem.format == "carousel", ContentItem.image_paths.isnot(None)))
    assert car and all(publisher.storage(p).exists() for p in car.image_paths)


def test_test_mode_never_publishes_for_real(db, demo_result):
    posts = list(db.scalars(select(SocialPost).where(SocialPost.status.in_(["published", "test"]))))
    assert posts and all(p.status == "test" and p.remote_id is None for p in posts)
    sent_public = db.scalar(select(OutboxMessage).where(OutboxMessage.audience == "public",
                                                        OutboxMessage.status == "sent"))
    assert sent_public is None


def test_linkedin_waits_for_owner(db, demo_result):
    li = db.scalar(select(SocialPost).where(SocialPost.platform == "linkedin",
                                            SocialPost.status == "awaiting_approval"))
    assert li is not None and li.approval_id
    owner = db.scalar(select(approvals.User).where(approvals.User.telegram_chat_id == 424242))
    approvals.decide(db, li.approval_id, owner, "approve")
    assert li.status == "scheduled"


def test_without_ai_nothing_posts_by_itself(db, demo_result):
    """No API key → no fact check → every platform asks the owner first."""
    item = db.scalar(select(ContentItem).where(ContentItem.status == "planned", ContentItem.format == "reel"))
    publisher.produce(db, item)
    statuses = {p.status for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id))}
    assert statuses == {"awaiting_approval"}


def test_auto_policy_schedules_when_checked(db, demo_result):
    item = db.scalar(select(ContentItem).where(ContentItem.status == "planned"))
    item.package = {"caption": "x", "missing_info": []}
    item.check = {"ok": True, "problems": []}
    publisher.route(db, item)
    for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id)):
        expected = "awaiting_approval" if p.platform == "linkedin" else "scheduled"
        assert p.status == expected


def test_pause_stops_publishing(db, demo_result):
    db.get(Setting, "marketing_paused").value = "yes"
    assert publisher.publish_due(db) == "paused"
    db.get(Setting, "marketing_paused").value = "no"


def test_comments_become_leads_and_complaints_go_to_people(db, demo_result):
    leads = list(db.scalars(select(Lead)))
    assert any("Madhurawada" in (ld.interest or "") for ld in leads)
    complaint = db.scalar(select(SocialComment).where(SocialComment.text.like("%bad service%")))
    assert complaint.reply_status == "handover" and not complaint.is_lead
    praise = db.scalar(select(SocialComment).where(SocialComment.text.like("Super kitchen%")))
    assert praise.intent == "praise" and not praise.is_lead


def test_sales_alerted_on_telegram_for_new_lead(db, demo_result):
    alerts = list(db.scalars(select(OutboxMessage).where(OutboxMessage.recipient == "424242",
                                                         OutboxMessage.body.like("%lead%"))))
    assert alerts


def test_simulate_only_in_test_mode(db):
    c = engagement.simulate(db, "how much for wardrobe?")
    assert c.is_lead and c.reply_status == "test"


def test_public_media_links_are_signed(db, demo_result):
    reel = db.scalar(select(ContentItem).where(ContentItem.video_path.isnot(None)))
    url = publisher.public_url(reel.video_path)
    token = url.rsplit("/", 1)[1]
    assert publisher.resolve_public(token) is not None
    assert publisher.resolve_public(token + "x") is None
    assert publisher.resolve_public(publisher._signer().dumps("../.env")) is None


def test_tokens_are_encrypted(db):
    connections.save(db, "linkedin", "secret-token-123", account_id="urn:li:person:x")
    c = connections.get(db, "linkedin")
    assert "secret-token-123" not in (c.token_enc or "")
    assert connections.token(db, "linkedin")[1] == "secret-token-123"
    connections.disconnect(db, "linkedin")


def test_week_planning_is_idempotent(db, demo_result):
    week = planner.week_start_for(date.today())
    assert planner.plan_week(db, week) == []


def test_module_off_skips_jobs(db):
    from app.core.scheduler import module_job

    db.get(ModuleSwitch, "M01").enabled = False
    db.commit()
    assert module_job("M01", lambda d: "ran")() == "module off"
    db.get(ModuleSwitch, "M01").enabled = True
    db.commit()


def test_mixed_telugu_english_wrapping():
    lines = wrap("మీ కిచెన్ ఇలా మారింది modular kitchen with Hettich hardware", 60, 500)
    assert len(lines) >= 2 and all(lines)


def test_failed_publish_retries_then_alerts(db, demo_result, monkeypatch):
    item = db.scalar(select(ContentItem).where(ContentItem.video_path.isnot(None)))
    p = SocialPost(content_item_id=item.id, platform="instagram_retrytest", status="scheduled",
                   scheduled_at=datetime.now(timezone.utc) - timedelta(minutes=1))
    db.add(p)
    db.flush()
    monkeypatch.setattr(outbox, "is_test_mode", lambda *a, **k: False)
    monkeypatch.setattr(publisher, "_do_publish", lambda *a: (_ for _ in ()).throw(RuntimeError("boom")))
    for _ in range(publisher.MAX_ATTEMPTS):
        publisher.publish_one(db, p)
    assert p.status == "failed" and "boom" in p.error
    db.delete(p)


def test_media_rejects_dark_photo(db, tmp_path):
    from PIL import Image

    from app.modules.m01_marketing import media

    path = tmp_path / "dark.jpg"
    Image.new("RGB", (1200, 900), (5, 5, 5)).save(path)
    a = media.ingest(db, "upload", "dark-1", path, "dark.jpg")
    media.check_asset(db, a)
    assert a.status == "rejected" and "dark" in a.reject_reason
    assert not media.usable_for_auto(a)
    assert db.get(MediaAsset, a.id) is not None
