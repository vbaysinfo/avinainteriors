"""Comments & DMs → automatic replies + leads.

- Every new comment/DM is read and classified (enquiry, question, praise,
  complaint, negotiation, spam).
- Enquiries become LEADS in the CRM (with the post they came from), and the
  sales team gets a Telegram alert straight away.
- Simple questions and enquiries get an automatic reply from the knowledge
  files only. Complaints, angry messages, price negotiation and anything unclear are
  NOT answered automatically; they go to a human on Telegram.
"""
import logging
import re
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import ai, outbox
from app.core.models import Lead, LeadActivity, User
from app.modules.m01_marketing.models import SocialComment, SocialPost
from app.modules.m01_marketing.planner import setting

log = logging.getLogger(__name__)
MODULE = "M01"


class CommentAnalysis(BaseModel):
    intent: str = Field(description="enquiry, question, praise, complaint, negotiation, spam or other")
    is_lead: bool = Field(description="true if the person may want to buy interiors/furniture from us")
    lead_score: str = Field(description="hot (clear need + soon), warm, or cold")
    score_reasons: str
    interest: str = Field(description="what they want, e.g. '2BHK full interiors', 'modular kitchen'; empty if none")
    location: str = Field(description="area/city if mentioned, else empty")
    needs_human: bool = Field(description="true for complaints, anger, negotiation, discounts, or if unsure")
    reply: str = Field(description="short friendly public reply in the commenter's language using ONLY knowledge-file "
                                   "facts; invite them to WhatsApp/DM for details; empty if needs_human or spam")


LEAD_WORDS = r"price|cost|rate|budget|quote|quotation|how much|contact|number|details|interested|call me|" \
             r"\bdm\b|whatsapp|site visit|need|want|looking for|ఎంత|ధర|రేటు|కావాలి|నంబర్"
TOPIC_WORDS = r"2bhk|3bhk|4bhk|villa|flat|kitchen|wardrobe|interior|office|shop"
HUMAN_WORDS = r"worst|bad|cheat|fraud|complain|problem|issue|delay|refund|angry|not happy|poor|disappoint|discount|" \
              r"negotiat|less price|reduce|మోసం|బాలేదు|ఆలస్యం"
SPAM_WORDS = r"follow me|check my|promo|crypto|earn money|http"


def analyse(db: Session, c: SocialComment) -> CommentAnalysis:
    try:
        return ai.ask_json(
            db,
            f"A person wrote this {c.kind} on our {c.platform}"
            + (" post" if c.kind == "comment" else " direct messages")
            + f":\n\n\"{c.text}\"\n\nClassify it and, if appropriate, write our reply. "
            + f"Our WhatsApp for enquiries: {setting(db, 'business_phone', '') or 'see knowledge files'}.",
            CommentAnalysis, max_tokens=2000,
        )
    except ai.AIUnavailable:
        return _rule_analysis(db, c.text)


def _rule_analysis(db: Session, text: str) -> CommentAnalysis:
    t = text.lower()
    phone = setting(db, "business_phone", "")
    contact = f"WhatsApp us at {phone}" if phone else "send us a DM"
    if re.search(SPAM_WORDS, t):
        return CommentAnalysis(intent="spam", is_lead=False, lead_score="cold", score_reasons="spam words",
                               interest="", location="", needs_human=False, reply="")
    if re.search(HUMAN_WORDS, t):
        return CommentAnalysis(intent="complaint", is_lead=False, lead_score="cold", score_reasons="needs a person",
                               interest="", location="", needs_human=True, reply="")
    if re.search(LEAD_WORDS, t) or ("?" in t and re.search(TOPIC_WORDS, t)):
        hot = bool(re.search(r"price|cost|how much|visit|quote|ఎంత|ధర", t))
        return CommentAnalysis(intent="enquiry", is_lead=True, lead_score="hot" if hot else "warm",
                               score_reasons="asks about price/visit" if hot else "shows interest",
                               interest=text[:200], location="", needs_human=False,
                               reply=f"Thank you for your interest! 🙏 Please {contact} for a free design "
                                     f"consultation. Our team will share all details.")
    if re.search(r"nice|super|beautiful|wow|great|awesome|love|చాలా బాగుంది|సూపర్|👌|😍|❤", t):
        return CommentAnalysis(intent="praise", is_lead=False, lead_score="cold", score_reasons="", interest="",
                               location="", needs_human=False, reply="Thank you so much! 🙏✨")
    return CommentAnalysis(intent="other", is_lead=False, lead_score="cold", score_reasons="", interest="",
                           location="", needs_human=True, reply="")


def _staff_to_alert(db: Session, roles=("owner", "sales", "manager")) -> list[User]:
    return [u for u in db.scalars(select(User).where(User.role.in_(roles), User.is_active.is_(True)))
            if u.telegram_chat_id]


def _alert(db: Session, text: str, roles=("owner", "sales", "manager")) -> None:
    for u in _staff_to_alert(db, roles):
        outbox.send(db, "telegram", str(u.telegram_chat_id), text, audience="staff")


def _make_lead(db: Session, c: SocialComment, a: CommentAnalysis) -> Lead:
    lead = db.scalar(select(Lead).where(Lead.source == c.platform, Lead.handle == c.author_name,
                                        Lead.stage.notin_(["won", "lost"])))
    if lead is None:
        lead = Lead(source=c.platform, handle=c.author_name, name=None, source_post_id=c.social_post_id,
                    source_detail=f"{c.kind}: {c.text[:300]}", stage="new")
        db.add(lead)
        db.flush()
    lead.score = a.lead_score if a.lead_score in ("hot", "warm", "cold") else "warm"
    lead.score_reasons = a.score_reasons
    lead.interest = a.interest or lead.interest
    lead.location = a.location or lead.location
    lead.last_contact_at = datetime.now(timezone.utc)
    db.add(LeadActivity(lead_id=lead.id, kind=c.kind, text=c.text))
    return lead


def _send_reply(db: Session, c: SocialComment, text: str) -> None:
    from app.integrations import google, instagram

    def deliver():
        if c.platform == "instagram" and c.kind == "comment":
            return {"id": instagram.reply_comment(db, c.remote_id, text)}
        if c.platform == "instagram" and c.kind == "dm":
            return {"id": instagram.send_dm(db, c.author_id, text)}
        if c.platform == "youtube":
            return {"id": google.reply_comment(db, c.remote_id, text)}
        raise RuntimeError(f"Replies on {c.platform} are not supported")

    msg = outbox.send(db, c.platform, c.author_name or c.author_id or "?", text,
                      audience="customer" if c.kind == "dm" else "public", approved=True, module_code=MODULE,
                      deliver=deliver, payload={"comment_id": c.id})
    c.reply_text = text
    c.reply_status = {"sent": "sent", "test": "test"}.get(msg.status, "failed")
    c.replied_at = datetime.now(timezone.utc)


def process(db: Session, c: SocialComment) -> SocialComment:
    a = analyse(db, c)
    c.intent = a.intent[:20]
    auto_reply = setting(db, "auto_reply_comments", "on") == "on"
    if a.is_lead:
        lead = _make_lead(db, c, a)
        c.is_lead, c.lead_id = True, lead.id
        icon = {"hot": "🔥", "warm": "🙂", "cold": "❄️"}.get(lead.score, "")
        _alert(db, f"{icon} New {lead.score.upper()} lead from {c.platform.title()} ({c.kind})\n"
                   f"{c.author_name}: \"{c.text[:300]}\"\nInterest: {a.interest or '-'}\nLead #{lead.id}")
    if a.intent == "spam":
        c.reply_status = "skipped"
    elif a.needs_human or not a.reply.strip():
        c.reply_status = "handover"
        _alert(db, f"🙋 Please reply personally ({c.platform} {c.kind}, {a.intent})\n"
                   f"{c.author_name}: \"{c.text[:300]}\"", roles=("owner", "sales", "manager", "marketing"))
    elif auto_reply:
        _send_reply(db, c, a.reply.strip())
    else:
        c.reply_status = "handover"
    return c


def store(db: Session, platform: str, kind: str, remote_id: str, text: str, author_name: str | None,
          author_id: str | None, when: datetime | None, social_post_id: int | None = None,
          thread_id: str | None = None) -> SocialComment | None:
    if db.scalar(select(SocialComment.id).where(SocialComment.platform == platform,
                                               SocialComment.remote_id == remote_id)):
        return None
    c = SocialComment(platform=platform, kind=kind, remote_id=remote_id, text=text or "", author_name=author_name,
                      author_id=author_id, received_at=when or datetime.now(timezone.utc),
                      social_post_id=social_post_id, thread_id=thread_id)
    db.add(c)
    db.flush()
    return c


def _parse_time(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00").replace("+0000", "+00:00"))
    except ValueError:
        return None


def poll(db: Session) -> str:
    """Fetch new comments/DMs from the last 30 days of posts and handle them."""
    from app.integrations import connections, google, instagram

    since = datetime.now(timezone.utc) - timedelta(days=30)
    posts = list(db.scalars(select(SocialPost).where(SocialPost.status == "published",
                                                    SocialPost.published_at >= since)))
    new = []
    for p in posts:
        try:
            if p.platform == "instagram" and connections.get(db, "instagram"):
                for c in instagram.recent_comments(db, p.remote_id):
                    sc = store(db, "instagram", "comment", c["id"], c.get("text", ""), c.get("username"),
                               (c.get("from") or {}).get("id"), _parse_time(c.get("timestamp")), p.id, p.remote_id)
                    if sc:
                        new.append(sc)
            elif p.platform == "youtube" and connections.get(db, "google"):
                for c in google.recent_comments(db, p.remote_id):
                    sc = store(db, "youtube", "comment", c["id"], c["text"], c.get("author"), c.get("author_id"),
                               _parse_time(c.get("timestamp")), p.id, p.remote_id)
                    if sc:
                        new.append(sc)
        except Exception as exc:
            log.warning("Could not read comments for post %s: %s", p.id, exc)
    if connections.get(db, "instagram") and setting(db, "instagram_dm_replies", "on") == "on":
        try:
            for m in instagram.recent_dms(db):
                sc = store(db, "instagram", "dm", m["id"], m["text"], m.get("username"), m.get("from_id"),
                           _parse_time(m.get("timestamp")), None, m.get("thread"))
                if sc:
                    new.append(sc)
        except Exception as exc:
            log.info("Instagram DMs not available: %s", exc)
    for c in new:
        process(db, c)
    return f"{len(new)} new comments/messages"


def simulate(db: Session, text: str, platform: str = "instagram") -> SocialComment:
    """TEST MODE helper: pretend someone commented on our latest post."""
    post = db.scalar(select(SocialPost).where(SocialPost.platform == platform,
                                              SocialPost.status.in_(["published", "test"]))
                     .order_by(SocialPost.id.desc()).limit(1))
    n = int(datetime.now().timestamp() * 1000)
    c = store(db, platform, "comment", f"sim-{n}", text, f"test_user_{n % 1000}", f"sim{n}",
              datetime.now(timezone.utc), post.id if post else None)
    return process(db, c)
