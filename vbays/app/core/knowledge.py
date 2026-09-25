"""Knowledge files: the ONLY facts the AI may tell customers.

The files in /knowledge are loaded into the database on first start. After
that, edit them in the admin website; every save keeps the old version.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.models import KnowledgeDoc, User

KNOWLEDGE_FILES = ["services.md", "faq.md", "process.md", "policies.md", "brand_guide.md"]


def latest(db: Session, name: str) -> KnowledgeDoc | None:
    return db.scalar(select(KnowledgeDoc).where(KnowledgeDoc.name == name).order_by(KnowledgeDoc.version.desc()).limit(1))


def history(db: Session, name: str) -> list[KnowledgeDoc]:
    return list(db.scalars(select(KnowledgeDoc).where(KnowledgeDoc.name == name).order_by(KnowledgeDoc.version.desc())))


def save(db: Session, name: str, content: str, user: User | None) -> KnowledgeDoc:
    if name not in KNOWLEDGE_FILES:
        raise ValueError(f"Unknown knowledge file: {name}")
    current = db.scalar(select(func.max(KnowledgeDoc.version)).where(KnowledgeDoc.name == name)) or 0
    doc = KnowledgeDoc(name=name, version=current + 1, content=content, updated_by_id=user.id if user else None)
    db.add(doc)
    db.flush()
    # Keep the file on disk in sync so it can be uploaded to Claude Desktop too.
    path = get_settings().knowledge_dir / name
    if path.parent.exists():
        path.write_text(content, encoding="utf-8")
    return doc


def seed_from_disk(db: Session) -> int:
    added = 0
    for name in KNOWLEDGE_FILES:
        path = get_settings().knowledge_dir / name
        if latest(db, name) is None and path.exists():
            db.add(KnowledgeDoc(name=name, version=1, content=path.read_text(encoding="utf-8")))
            added += 1
    db.flush()
    return added


def all_knowledge_text(db: Session) -> str:
    """All knowledge files joined together, for the AI's instructions."""
    parts = []
    for name in KNOWLEDGE_FILES:
        doc = latest(db, name)
        if doc:
            parts.append(f"<knowledge file=\"{name}\">\n{doc.content}\n</knowledge>")
    return "\n\n".join(parts)
