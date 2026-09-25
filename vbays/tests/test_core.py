from decimal import Decimal

import pytest
from sqlalchemy import select

from app.core import approvals, auth, knowledge, masterdata, outbox
from app.core.models import AuditLog, OutboxMessage, PaymentMilestoneTemplate, RateCardItem
from app.core.permissions import can_decide_approval, has_permission
from app.integrations import telegram_bot
from tests.conftest import make_user

# --- permissions -----------------------------------------------------------


def test_owner_can_do_everything():
    assert has_permission("owner", "users.manage")
    assert has_permission("owner", "anything.at.all")


def test_designer_cannot_see_customer_phones_or_manage_users():
    assert not has_permission("designer", "customers.view_contact")
    assert not has_permission("designer", "users.manage")
    assert not has_permission("factory_staff", "dashboard.view")


def test_only_matching_role_or_owner_decides():
    assert can_decide_approval("owner", "accounts")
    assert can_decide_approval("accounts", "accounts")
    assert not can_decide_approval("sales", "owner")
    assert not can_decide_approval("accounts", "owner")


# --- login -----------------------------------------------------------------


def test_login_and_lockout(db):
    u = make_user(db, "sales", password="Correct#123")
    assert auth.authenticate(db, u.email.upper(), "Correct#123").id == u.id
    for _ in range(auth.MAX_FAILED_LOGINS):
        assert auth.authenticate(db, u.email, "wrong") is None
    assert auth.authenticate(db, u.email, "Correct#123") is None  # locked


# --- outbox / test mode ----------------------------------------------------


def test_customer_message_without_approval_is_blocked(db):
    m = outbox.send(db, "whatsapp", "+911", "hi", audience="customer")
    assert m.status == "blocked"


def test_customer_message_in_test_mode_is_not_sent(db):
    called = []
    outbox.register_sender("whatsapp", lambda *a: called.append(a))
    try:
        m = outbox.send(db, "whatsapp", "+911", "hi", audience="customer", approved=True)
    finally:
        outbox.SENDERS.pop("whatsapp")
    assert m.status == "test" and called == []


def test_staff_message_uses_sender(db):
    outbox.register_sender("telegram", lambda r, b, p: {"message_id": 7})
    try:
        m = outbox.send(db, "telegram", "123", "hello staff")
    finally:
        outbox.SENDERS.pop("telegram")
    assert m.status == "sent" and m.payload["result"]["message_id"] == 7


def test_staff_message_without_connection_is_recorded(db):
    m = outbox.send(db, "telegram", "123", "hello")
    assert m.status == "test" and "No telegram connection" in m.error


# --- approvals -------------------------------------------------------------


def test_approval_flow_runs_handler_and_audits(db):
    owner = make_user(db, "owner")
    sales = make_user(db, "sales")
    a = approvals.request(db, "test", "Test item", requested_by=sales)
    assert a.status == "pending"
    with pytest.raises(approvals.ApprovalError):
        approvals.decide(db, a.id, sales, "approve")
    approvals.decide(db, a.id, owner, "approve", "fine")
    assert a.status == "approved" and a.decided_by_id == owner.id
    msg = db.scalar(select(OutboxMessage).where(OutboxMessage.approval_id == a.id))
    assert msg.status == "test" and msg.audience == "customer"
    actions = set(db.scalars(select(AuditLog.action).where(AuditLog.entity_id == str(a.id))))
    assert {"approval.requested", "approval.approved"} <= actions
    with pytest.raises(approvals.ApprovalError, match="Already approved"):
        approvals.decide(db, a.id, owner, "reject")


def test_approval_notifies_linked_approvers_on_telegram(db):
    make_user(db, "owner", chat_id=555001)
    a = approvals.request(db, "test", "Notify me")
    msgs = list(db.scalars(select(OutboxMessage).where(OutboxMessage.recipient == "555001")))
    assert msgs and "reply_markup" in msgs[-1].payload
    assert f"apv:{a.id}:approve" in str(msgs[-1].payload)


# --- telegram logic --------------------------------------------------------


def test_telegram_link_and_button(db):
    owner = make_user(db, "owner")
    code = telegram_bot.new_link_code(db, owner)
    assert "wrong or expired" in telegram_bot.link_account(db, 777001, "000000" if code != "000000" else "111111", "x")
    assert "Connected" in telegram_bot.link_account(db, 777001, code, "boss")
    assert owner.telegram_chat_id == 777001 and owner.telegram_link_code is None
    a = approvals.request(db, "test", "From telegram")
    result = telegram_bot.decide_from_callback(db, 777001, f"apv:{a.id}:reject")
    assert "REJECTED" in result and a.status == "rejected"
    assert "not linked" in telegram_bot.decide_from_callback(db, 999999, f"apv:{a.id}:approve")


# --- knowledge -------------------------------------------------------------


def test_knowledge_versions(db):
    first = knowledge.latest(db, "faq.md")
    assert first is not None
    doc = knowledge.save(db, "faq.md", "Q: test\nA: yes", None)
    assert doc.version == first.version + 1
    assert knowledge.latest(db, "faq.md").content.startswith("Q: test")
    assert "Q: test" in knowledge.all_knowledge_text(db)


# --- master data -----------------------------------------------------------


def test_sample_master_data_imports(db):
    from app.core.setup import import_folder

    report = import_folder(db)
    assert all("ERRORS" not in v for v in report.values()), report
    item = db.scalar(select(RateCardItem).where(RateCardItem.item_code == "KIT-BASE"))
    assert item.basic_rate_paise == 420000  # ₹4,200.00
    total = sum(p.percent for p in db.scalars(select(PaymentMilestoneTemplate)))
    assert total == Decimal(100)


def test_import_reports_row_errors():
    ds = masterdata.DATASETS["rate_card"]
    bad = masterdata.read_table("x.csv", b"item_code,item_name,category,unit,basic_rate,premium_rate,luxury_rate,gst_percent\n"
                                          b"A,Thing,Cat,nos,abc,1,1,18\nB,,Cat,nos,1,1,1,18\n")
    res = masterdata.validate(ds, bad)
    assert any("Row 2, basic_rate" in e for e in res.errors)
    assert any("Row 3, item_name: is empty" in e for e in res.errors)


def test_import_rejects_missing_columns_and_bad_milestones():
    res = masterdata.validate(masterdata.DATASETS["rate_card"], [{"item_code": "A"}])
    assert res.errors[0].startswith("Missing column")
    rows = [
        {"template_name": "t", "sequence": "1", "milestone_name": "a", "percent": "60", "trigger": "booking"},
        {"template_name": "t", "sequence": "2", "milestone_name": "b", "percent": "30", "trigger": "handover"},
    ]
    res = masterdata.validate(masterdata.DATASETS["payment_milestones"], rows)
    assert "add up to 90" in res.errors[0]


def test_xlsx_import(tmp_path):
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.append(["sequence", "name", "planned_hours", "needs_photo", "needs_qc"])
    ws.append([1, "Cutting", 8, "Y", "N"])
    p = tmp_path / "s.xlsx"
    wb.save(p)
    rows = masterdata.read_table("s.xlsx", p.read_bytes())
    res = masterdata.validate(masterdata.DATASETS["production_stages"], rows)
    assert res.ok and res.rows[0]["needs_photo"] is True and res.rows[0]["sequence"] == 1
