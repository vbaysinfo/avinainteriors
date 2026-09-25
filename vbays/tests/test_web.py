import re

import pytest
from fastapi.testclient import TestClient

from app.core.db import session_scope
from app.main import create_app
from tests.conftest import make_user


@pytest.fixture(scope="module")
def client():
    with TestClient(create_app()) as c:
        yield c


def csrf(html: str) -> str:
    return re.search(r'name="csrf_token" value="([^"]+)"', html).group(1)


def login(client, role):
    with session_scope() as db:
        u = make_user(db, role, password="Passw0rd!")
        email = u.email
    client.cookies.clear()
    page = client.get("/login")
    r = client.post("/login", data={"csrf_token": csrf(page.text), "login": email, "password": "Passw0rd!"})
    assert r.status_code == 200 and "Good day" in r.text or role == "factory_staff"
    return r


def test_pages_need_login(client):
    client.cookies.clear()
    r = client.get("/approvals", follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == "/login"


def test_owner_sees_all_pages(client):
    login(client, "owner")
    for path in ["/", "/users", "/modules", "/settings", "/knowledge", "/knowledge/faq.md", "/masterdata",
                 "/masterdata/rate_card", "/approvals", "/outbox", "/audit", "/backups"]:
        assert client.get(path).status_code == 200, path


def test_sales_is_limited(client):
    r = login(client, "sales")
    assert ">Staff<" not in r.text
    assert client.get("/users").status_code == 403
    assert client.get("/audit").status_code == 403
    assert client.get("/masterdata/staff_roles").status_code == 403


def test_post_without_csrf_is_refused(client):
    login(client, "owner")
    assert client.post("/approvals/test", data={"csrf_token": "nope"}).status_code == 400


def test_owner_creates_and_approves_test_item(client):
    r = login(client, "owner")
    tok = csrf(r.text)
    r = client.post("/approvals/test", data={"csrf_token": tok})
    aid = re.search(r"Test approval #(\d+)", r.text).group(1)
    r = client.post(f"/approvals/{aid}", data={"csrf_token": tok, "decision": "approve"})
    assert f"#{aid} approved" in r.text
    assert "would go to a customer" in client.get("/outbox").text


def test_upload_preview_and_confirm(client):
    r = login(client, "owner")
    tok = csrf(r.text)
    csv = b"code,name,brand,type,unit,cost_rate,sell_rate\nZZ-1,Test hinge,Brand,hinge,nos,99.50,\n"
    r = client.post("/masterdata/hardware/upload", data={"csrf_token": tok}, files={"file": ("h.csv", csv, "text/csv")})
    assert "rows look good" in r.text
    token = re.search(r'name="token" value="([^"]+)"', r.text).group(1)
    r = client.post("/masterdata/hardware/confirm", data={"csrf_token": tok, "token": token})
    assert "1 added" in r.text and "₹99.50" in r.text


def test_unbuilt_module_cannot_be_switched_on(client):
    r = login(client, "owner")
    r = client.post("/modules/M01", data={"csrf_token": csrf(r.text), "field": "enabled"})
    assert "not built yet" in r.text
