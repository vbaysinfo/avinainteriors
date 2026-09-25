"""The AI brain: a thin wrapper around the Claude API.

- The model comes from CLAUDE_MODEL in .env.
- Answers are grounded ONLY in the knowledge files. If the answer is not in
  them, the AI must say a team member will get back (and we alert staff).
- Without an API key, or in test mode with no key, a clearly-marked fake
  answer is returned so everything else can still be tested.
"""
import logging

import anthropic
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.knowledge import all_knowledge_text

log = logging.getLogger(__name__)

HANDOVER_MARKER = "[HANDOVER]"

GROUNDING_RULES = f"""You are Vbays, the assistant for {{company}}.
Rules you must follow:
- Use ONLY facts from the knowledge files below and the data given in the request.
- Never invent prices, timelines, warranty terms, offers, stock or project counts.
- Any price is approximate and final only after site measurement; say so.
- If the answer is not in the knowledge files, or the person is angry, complaining,
  negotiating price, or asking for a discount, reply politely that a team member
  will contact them soon, and put {HANDOVER_MARKER} at the very end of your reply.
- Reply in the language the person used (Telugu, English, or Telugu-English mix).
- Be professional, friendly and never pushy. Keep replies short.
"""

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)
    return _client


def available() -> bool:
    return bool(get_settings().anthropic_api_key)


def system_prompt(db: Session) -> list[dict]:
    s = get_settings()
    text = GROUNDING_RULES.format(company=s.company_name) + "\n\n" + all_knowledge_text(db)
    # The knowledge block is identical on every call, so we cache it (cheaper, faster).
    return [{"type": "text", "text": text, "cache_control": {"type": "ephemeral"}}]


def ask(db: Session, question: str, extra_context: str = "", max_tokens: int = 2000) -> str:
    """Answer a question using the knowledge files. Returns plain text."""
    if not available():
        return f"[TEST AI REPLY: no ANTHROPIC_API_KEY set] You asked: {question[:200]}"
    content = f"{extra_context}\n\n{question}".strip()
    try:
        response = _get_client().messages.create(
            model=get_settings().claude_model,
            max_tokens=max_tokens,
            system=system_prompt(db),
            messages=[{"role": "user", "content": content}],
        )
    except anthropic.AuthenticationError:
        log.error("Claude API key is invalid")
        return f"Sorry, our assistant is not available right now. A team member will contact you soon. {HANDOVER_MARKER}"
    except (anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.APIStatusError) as exc:
        log.warning("Claude API call failed: %s", exc)
        return f"Sorry, our assistant is not available right now. A team member will contact you soon. {HANDOVER_MARKER}"

    if response.stop_reason == "refusal":
        return f"A team member will contact you soon. {HANDOVER_MARKER}"
    return "".join(b.text for b in response.content if b.type == "text").strip()


def needs_handover(reply: str) -> bool:
    return HANDOVER_MARKER in reply


class AIUnavailable(Exception):
    """No API key, or the API failed. Callers fall back to simple rules."""


def ask_json(db: Session, instructions: str, output_model, images: list[tuple[bytes, str]] | None = None,
             max_tokens: int = 16000, use_knowledge: bool = True):
    """Ask Claude and get back a validated pydantic object (structured output).

    images: optional list of (bytes, media_type) for photo checks (Claude vision).
    """
    if not available():
        raise AIUnavailable("No ANTHROPIC_API_KEY set")
    import base64

    content: list[dict] = []
    for data, media_type in images or []:
        content.append({"type": "image", "source": {"type": "base64", "media_type": media_type,
                                                     "data": base64.b64encode(data).decode()}})
    content.append({"type": "text", "text": instructions})
    kwargs = {"system": system_prompt(db)} if use_knowledge else {}
    try:
        response = _get_client().messages.parse(
            model=get_settings().claude_model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": content}],
            output_format=output_model,
            **kwargs,
        )
    except (anthropic.APIConnectionError, anthropic.APIStatusError) as exc:
        raise AIUnavailable(str(exc)) from exc
    if response.stop_reason in ("refusal", "max_tokens") or response.parsed_output is None:
        raise AIUnavailable(f"AI could not complete the request ({response.stop_reason})")
    return response.parsed_output
