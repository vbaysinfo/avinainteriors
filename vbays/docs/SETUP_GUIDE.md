# Vbays: Setup Guide (Phase 1)

This guide gets Vbays running on **your own computer** so you can try it.
Moving it to a cloud server (so it runs 24/7) is Phase 10.

You'll need about 30–45 minutes. You don't need to know how to code. Copy
and paste the commands exactly.

---

## Option A: Docker (recommended for Windows and Mac)

Docker runs Vbays and its database together in one box.

1. **Install Docker Desktop:** <https://www.docker.com/products/docker-desktop>.
   Open it once and wait until it says *Docker is running*.
2. **Get the Vbays folder** onto your computer. On GitHub, open the
   repository → green **Code** button → **Download ZIP** → unzip it. Inside,
   open the `vbays` folder.
3. **Create your settings file:** copy `.env.example` and name the copy
   `.env`. Open it in Notepad and change:
   - `SECRET_KEY=`: type a long random sentence with no spaces, e.g.
     `SECRET_KEY=Avina-Vizag-2026-kitchens-wardrobes-9f8e7d6c`
   - Leave `TEST_MODE=true`.
4. **Open a terminal in the `vbays` folder.** Windows: open the folder, click
   the address bar, type `cmd`, press Enter. Mac: right-click the folder →
   *New Terminal at Folder*.
5. **Start Vbays:**
   ```
   docker compose up -d --build
   ```
   The first time takes 3–5 minutes.
6. **Create your owner login** (it asks for your name, email and a password):
   ```
   docker compose exec app python -m app.cli create-owner
   ```
7. **Load the sample master data** (rate card, materials, stages…):
   ```
   docker compose exec app python -m app.cli import-master
   ```
8. Open **<http://localhost:8000>** in your browser and log in.

To stop: `docker compose down`. To start again: `docker compose up -d`.

## Option B: Without Docker (Python + PostgreSQL installed directly)

1. Install **Python 3.11 or newer** (<https://www.python.org/downloads/>;
   on Windows tick *Add Python to PATH*).
2. Install **PostgreSQL 16** (<https://www.postgresql.org/download/>).
   Remember the password you set for the `postgres` user.
3. Create the database. Open *SQL Shell (psql)* and run:
   ```
   CREATE USER vbays WITH PASSWORD 'choose-a-password';
   CREATE DATABASE vbays OWNER vbays;
   ```
4. In the `vbays` folder, copy `.env.example` to `.env` and set:
   ```
   DATABASE_URL=postgresql+psycopg://vbays:choose-a-password@localhost:5432/vbays
   SECRET_KEY=<a long random sentence>
   ```
5. In a terminal in the `vbays` folder:
   ```
   python -m venv .venv
   .venv\Scripts\activate          (Windows)
   source .venv/bin/activate       (Mac/Linux)
   pip install -r requirements.txt
   python -m app.cli create-owner
   python -m app.cli import-master
   uvicorn app.main:app --port 8000
   ```
6. Open <http://localhost:8000>.

---

## Connect the Telegram bot (10 min)

1. In Telegram, open **@BotFather** → send `/newbot` → choose a name (e.g.
   *Vbays Avina*) and a username ending in `bot` (e.g. `vbays_avina_bot`).
2. BotFather replies with a **token** like `123456:ABC-...`. Put it in `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-...
   TELEGRAM_ENABLED=true
   ```
3. Restart Vbays (`docker compose up -d` or re-run `uvicorn`).
4. In Vbays → **Staff** → next to your name → **Telegram code**. A 6-digit
   code appears.
5. Open your bot in Telegram and send: `/link 123456` (your code).
   It replies **✅ Connected!**
6. Do the same for each staff member. They need their own code, which is
   valid for 30 minutes.

## Add your Claude API key (optional in Phase 1)

1. Go to <https://console.anthropic.com> → sign up → **API Keys** → create a
   key. Add ₹500–₹1,000 of credit.
2. In `.env`: `ANTHROPIC_API_KEY=sk-ant-...` and restart.
3. Test it: `python -m app.cli test-ai "What warranty do you give?"`
   (Docker: `docker compose exec app python -m app.cli test-ai "..."`).
   It answers **only** from your knowledge files.

---

## Your Phase 1 acceptance test (15 min)

| # | Do this | You should see |
|---|---|---|
| 1 | Log in as owner | Home page, orange **TEST MODE** bar at the top |
| 2 | **Staff** → add "Ravi", role *Sales*, with a password | Ravi appears in the list |
| 3 | **Master data** → *Rate card* → download template, change a rate in Excel, save, upload | A check page listing any mistakes, then **Import now** |
| 4 | **Approvals** → **+ Create a test approval** | A Telegram message with ✅ / ❌ buttons (if linked) |
| 5 | Tap **✅ Approve** on Telegram | Message updates to "APPROVED by …" |
| 6 | **Outbox** | A sample customer WhatsApp message with status **test** (not really sent) |
| 7 | **Audit log** | Every step above, with who and when |
| 8 | Log out, log in as Ravi | Ravi does **not** see Staff, Settings, Audit log |
| 9 | **Backups** → **Back up now** | A new backup file appears |
| 10 | **Knowledge** → edit `faq.md` → Save | Version number goes up; old version still in History |

## Where things are

| What | Where |
|---|---|
| Settings and keys | `.env` (never share this file) |
| Knowledge files | Edit in **Knowledge**, or `knowledge/` |
| Master data templates | `master_data/` (samples marked *SAMPLE*; replace with yours) |
| Backups | `backups/`: one file per day, last 14 days kept |
| Logs | `logs/vbays.log` |

## Running the automatic tests (for a developer)

```
pip install -r requirements-dev.txt
pytest
```
Tests use a separate `vbays_test` database (set `TEST_DATABASE_URL` to change
it) and never touch your real data.
