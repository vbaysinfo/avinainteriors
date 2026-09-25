# Vbays Phase 1: Architecture, Folder Structure and Database Design

> **Status: Phase 1 is built and tested** (see `SETUP_GUIDE.md`). It uses
> the defaults below wherever you haven't answered a question yet. Your
> answers to §10 can still change things before Phase 2.
>
> **Your decision (25 Sep 2026): no third-party tools.** Vbays posts to
> Instagram and YouTube itself through the official Meta and Google APIs.
> Buffer and Upload-Post are removed. See §9.

---

## 1. The big picture (in plain English)

Vbays is **one Python application** with **one database**. It talks to your
team on **Telegram**, to customers on **WhatsApp**, and to you on an **admin
website** and later in **Claude Desktop**. Each business area (marketing,
CRM, factory…) is a separate **module** that can be switched on or off.

```
                         ┌──────────────────────────────────────────┐
  Customers              │               VBAYS SERVER               │
  ─────────              │          (Python · FastAPI app)          │
  WhatsApp  ◀──────────▶ │                                          │
  Instagram/YouTube ◀──▶ │  ┌────────────── CORE ────────────────┐  │
                         │  │ Login & roles · Audit log          │  │
  Staff & Owner          │  │ Approval engine (nothing goes out  │  │
  ─────────────          │  │   without a human "yes")           │  │
  Telegram bot ◀───────▶ │  │ Test mode · Scheduler (jobs)       │  │
  Admin website ◀──────▶ │  │ AI brain (Claude) · Knowledge      │  │
  Claude Desktop (MCP) ◀▶│  │ Files/PDFs · Notifications         │  │
                         │  └────────────────────────────────────┘  │
                         │  ┌──────── MODULES (on/off) ───────────┐ │
                         │  │ M1 Marketing   M2 WhatsApp  M3 CRM   │ │
                         │  │ M4 Site visit  M5 Quotation M6 Pay   │ │
                         │  │ M7 Factory     M8 Inventory M9 Site  │ │
                         │  │ M10 Handover   M11 Tasks   M12 Dash  │ │
                         │  │ M13 MCP server                       │ │
                         │  └──────────────────────────────────────┘ │
                         └────────────────┬─────────────────────────┘
                                          │
                            ┌─────────────▼──────────────┐
                            │  PostgreSQL database        │
                            │  (one DB for all modules)   │
                            │  + daily automatic backup   │
                            └────────────────────────────┘
      Outside services: Claude API · Meta (WhatsApp/Instagram) · Google
      (Drive/Calendar/YouTube/Sheets) · Telegram · Razorpay (optional)
```

### Three safety ideas built into the core

1. **Approval engine.** Every outgoing thing (post, quotation, WhatsApp
   message template, discount, purchase order, payment request) is first
   saved as an *approval request*. It goes out only after the right person
   taps **Approve** on Telegram or the admin website. The approver and time
   are recorded.
2. **Test mode.** A switch (`VBAYS_TEST_MODE=true`) that makes **every**
   outside connection fake: WhatsApp, Instagram, YouTube, Telegram-to-
   customers and payments are only written to a log/"outbox" screen. You can
   also turn test mode on for one module at a time.
3. **Audit log.** Every important action ("Ravi approved quotation Q-0012
   at 4:05 PM") is stored and cannot be edited from the app.

---

## 2. Technology choices (recommended)

| Need | Choice | Why |
|---|---|---|
| Language | Python 3.11+ | As you asked. Huge library support. |
| Web server / API | FastAPI | Fast, modern, easy to add modules |
| Database | PostgreSQL 16 | Free, reliable. Local via Docker, or Supabase free tier. |
| Database code | SQLAlchemy 2 + Alembic | Safe database upgrades when we add modules later |
| Scheduled jobs | APScheduler (jobs defined in code, every run recorded in `job_runs`) | Backups, reminders, 8 AM summaries |
| Admin website | **FastAPI + simple server pages (Jinja2)** | See below |
| Telegram bot | python-telegram-bot v21 | Official API, free, buttons + photos |
| AI | Anthropic Claude API, model set in `.env` | Text + vision (photos, handwritten sheets) |
| PDFs | WeasyPrint (HTML → PDF) | Branded quotations/invoices look like a web page |
| Passwords | Argon2 hashing, login sessions via secure cookies | Industry standard |
| Settings/secrets | `.env` file (never committed) | No secrets in code |
| Packaging | Docker Compose (app + database) | One command to start everything |
| Database upgrades | Tables are created automatically on start. Alembic migrations are added in Phase 2, when the first existing table has to change. | |

**Admin panel: why not Streamlit?** Streamlit is quick for charts, but it's
weak at multiple staff logins with different roles, mobile-friendly forms and
page-by-page permissions. Plain server pages in FastAPI give us proper
role-based screens that work on a phone, in the **same app** as everything
else, with no separate JavaScript project. We can still add a Streamlit analytics page
later if you like it.

---

## 3. Folder structure

Files for later phases (e.g. `pdf.py`, `whatsapp.py`, module folders) are
added when their phase is built.

```
vbays/
├── README.md
├── .env.example               # every setting, with explanations (no real secrets)
├── docker-compose.yml         # app + PostgreSQL, one command start
├── pyproject.toml             # Python dependencies
├── alembic/                   # database upgrade scripts
├── knowledge/                 # services.md, faq.md, process.md, policies.md, brand_guide.md
├── master_data/               # Excel/CSV templates you fill in (see §5)
├── sample_data/               # demo customer/project for test mode
├── docs/                      # architecture, setup guide, role guides, costs
├── phase0/                    # Claude Desktop Project quick start
├── scripts/                   # import_master_data, backup, create_owner, seed_demo
├── storage/                   # uploaded photos, generated PDFs/videos (not in git)
├── backups/                   # daily DB backups (not in git)
├── logs/
├── tests/
└── app/
    ├── main.py                # starts the web server, bot and scheduler
    ├── config.py              # reads .env; module on/off switches; test mode
    ├── core/                  # shared by all modules
    │   ├── db.py              # database connection
    │   ├── models/            # core tables (users, audit, approvals, …)
    │   ├── auth.py            # login, sessions, role permissions
    │   ├── audit.py           # "who did what, when"
    │   ├── approvals.py       # the approval engine
    │   ├── notify.py          # send to Telegram/WhatsApp (fake in test mode)
    │   ├── ai.py              # Claude API wrapper (knowledge-grounded answers)
    │   ├── knowledge.py       # loads /knowledge files for the AI
    │   ├── files.py           # photo/document storage
    │   ├── pdf.py             # branded PDF generator
    │   ├── scheduler.py       # APScheduler setup
    │   └── consent.py         # DPDP consent + deletion requests
    ├── integrations/          # one file per outside service, each with a fake twin
    │   ├── telegram_bot.py
    │   ├── whatsapp.py        (Phase 3)
    │   ├── instagram.py       (Phase 2)
    │   ├── youtube.py         (Phase 2)
    │   ├── google_drive.py / google_calendar.py / google_sheets.py
    │   └── razorpay.py        (optional, Phase 5)
    ├── modules/               # one folder per business module
    │   ├── m01_marketing/     # each module has: models.py, service.py,
    │   ├── m02_whatsapp/      #   routes.py (admin screens), bot.py
    │   ├── m03_crm/           #   (Telegram commands), jobs.py (scheduled),
    │   ├── …                  #   and module.py (registers itself if ON)
    │   └── m13_mcp/
    └── web/
        ├── templates/         # admin pages (HTML)
        └── static/            # CSS, logo
```

**How on/off works:** `.env` has lines like `MODULE_M01_MARKETING=on`.
When the app starts, it loads only the modules that are ON. A module that is
OFF adds no screens, no bot commands and no jobs. Its data stays safe in the
database.

---

## 4. Roles and who sees what

| Role | Sees / does |
|---|---|
| **Owner** | Everything. Final approvals (discounts > X%, POs, posts, templates). |
| **Admin/Manager** (optional) | Everything except system settings and user management |
| **Sales** | Own leads (all leads if "sales head"), chats, site-visit booking, quotation drafts, customer contact details |
| **Designer** | Assigned projects: measurements, designs, quotation items. **No** customer phone numbers. |
| **Factory Manager** | Production jobs, BOM/cutting lists, inventory, purchase requests. Customer shown as project ID + first name only. |
| **Factory Staff** | Update stage + photo for their jobs on Telegram. Nothing else. |
| **Site Supervisor** | Assigned site visits and projects: address, measurements, daily updates, snags |
| **Accounts** | Orders, payments, invoices, vendor payments, exports. Read-only on CRM. |
| **Marketing** (optional) | Content calendar, media, analytics. No customer data. |

Customer phone numbers and addresses are shown only to roles that need them.
Every view of a full customer record is logged.

---

## 5. Master data (Excel/CSV you fill in)

In Phase 1 we'll create these templates in `vbays/master_data/`, plus an
import screen that checks for mistakes before saving:

| File | Columns (main ones) |
|---|---|
| `rate_card.csv` | item_code, item_name, category, unit (sqft/rft/nos), basic_rate, premium_rate, luxury_rate, gst_percent |
| `materials_finishes.csv` | code, name, type (board/laminate/acrylic/PU/edge band), brand, thickness_mm, sheet_size, unit, cost_rate, sell_rate |
| `hardware.csv` | code, name, brand, type (hinge/channel/handle/basket), unit, cost_rate, sell_rate |
| `product_catalog.csv` | code, name (e.g. "Base unit 600"), category, std_width/height/depth, default materials, default hardware list |
| `vendors.csv` | name, contact, phone, GSTIN, items supplied, payment terms |
| `staff_roles.csv` | name, role, phone, telegram_username, email |
| `production_stages.csv` | order, stage_name, planned_hours, needs_photo (Y/N), needs_qc (Y/N) |
| `payment_milestones.csv` | template_name, milestone_name, percent, trigger (booking/before_production/…) |
| `whatsapp_templates.csv` | name, language, category (utility/marketing), body with {placeholders}, approved_by_meta (Y/N) |

---

## 6. Database design

One PostgreSQL database. Every table has `id`, `created_at`, `updated_at`,
and (where it makes sense) `created_by`. Money is stored in **paise**
(whole numbers) so there are no rounding errors.

### 6.1 Core tables (built in Phase 1)

| Table | Holds | Key fields |
|---|---|---|
| `users` | Staff logins | name, phone, email, password_hash, role, telegram_chat_id, is_active |
| *(roles & permissions)* | What each role can do: kept in code (`app/core/permissions.py`) so it can't be changed by accident; shown on the Staff page | |
| `audit_log` | Every important action | user_id, action, entity_type, entity_id, before/after (JSON), ip, time. **Insert-only.** |
| `approvals` | The approval queue | type (post/quotation/discount/PO/template/payment_request), entity_id, requested_by, approver_role, status (pending/approved/rejected/edited), decided_by, decided_at, note |
| `settings` | Business settings editable from admin | key, value (e.g. `discount_owner_approval_percent = 5`) |
| `module_switches` | Module on/off + per-module test mode | module_code, enabled, test_mode |
| `customers` | One row per person/company | name, phone (unique), alt_phone, email, language_pref, address, area, city |
| `consents` | DPDP consent records | customer_id, purpose (whatsapp_updates/marketing_media/…), given_at, source, withdrawn_at |
| `data_requests` | Deletion/export requests | customer_id, type, status, completed_at |
| `files` | Every uploaded/generated file | owner entity, path/Drive id, type, uploaded_by, tags |
| `outbox` | Every outgoing message (real or test) | channel, to, body, status, sent_at, error, test_mode |
| `knowledge_docs` | Versions of knowledge files | name, content, version, updated_by |
| `notifications` | Staff alerts | user_id, text, read_at |
| `jobs_log` | Scheduled job runs | job_name, started, finished, result |

Master data tables (also Phase 1): `rate_card_items`, `materials`,
`hardware_items`, `product_catalog`, `vendors`, `production_stages`,
`payment_milestone_templates`, `message_templates`.

### 6.2 Module tables (built in later phases; designed now so they fit)

| Module | Tables |
|---|---|
| M1 Marketing | `content_plans`, `content_items` (format, hook, script, caption, hashtags, status, scheduled_at, platform_post_id), `media_assets` (Drive id, room_type, style, quality_score, consent_ok), `video_renders`, `social_comments`, `analytics_snapshots` |
| M2 WhatsApp | `conversations`, `messages` (in/out, text/media, language), `followup_schedule` |
| M3 CRM | `leads` (customer_id, source, source_post_id, stage, score, score_reasons, assigned_to, budget, property_type, bhk/sqft, timeline, new/renovation, lost_reason), `lead_activities` |
| M4 Site visit | `site_visits` (calendar_event_id, supervisor, status), `measurements` (room, item, width/height/depth, notes), `measurement_photos` |
| M5 Quotation | `designs` (+ revisions, client feedback), `quotations` (version, level, subtotal, discount, gst, total, status), `quotation_items` |
| M6 Orders/Payments | `projects` (project code e.g. AVN-2026-014), `orders`, `payment_milestones`, `payments`, `invoices`, `receipts` |
| M7 Factory | `production_jobs`, `job_units`, `bom_lines`, `cutting_list_panels`, `job_stage_events` (stage, photo, by, time), `qc_checks` |
| M8 Inventory | `stock_items`, `stock_movements` (in/out/adjust, linked job/GRN), `purchase_requests`, `purchase_orders`, `po_lines`, `goods_receipts`, `vendor_payments` |
| M9 Site execution | `project_schedule_tasks`, `daily_updates`, `snags` |
| M10 Handover | `handover_checklists`, `warranties`, `service_tickets`, `reviews_testimonials`, `referrals` |
| M11 Tasks | `tasks` (assigned_to, due_at, source module/entity, status), `attendance` |
| M12 Dashboard | reads from all tables (no new tables, plus cached `daily_metrics`) |

### 6.3 How records connect (the end-to-end flow)

```
content_item ─▶ social_comment ─▶ lead ─▶ conversation/messages
                                     │
customer ◀───────────────────────────┘
   │
   ├─▶ site_visit ─▶ measurements ─▶ design ─▶ quotation (v1, v2…)
   │                                              │ accepted
   │                                              ▼
   └──────────────────────────────▶ project ─▶ order ─▶ payment_milestones ─▶ payments/invoices
                                       │
                                       ├─▶ production_jobs ─▶ bom_lines ─▶ stock_movements
                                       ├─▶ schedule_tasks / daily_updates / snags
                                       └─▶ handover ─▶ warranty ─▶ service_tickets
                                                        └─▶ testimonial ─▶ media_asset (M1)
Every step ─▶ tasks (M11) + audit_log + dashboard (M12)
```

---

## 7. What Phase 1 delivers (and how you test it)

1. **One-command start** (`docker compose up`) with database + app.
2. **Admin website** with login, role-based menu, and these pages:
   Users & roles · Module switches & test mode · Settings · Knowledge files
   (view/edit with versions) · Master data import (upload Excel/CSV, preview
   errors, confirm) · Approvals queue · Outbox (what *would* be sent in test
   mode) · Audit log.
3. **Telegram bot base:** staff link their account with a one-time code;
   `/start`, `/link`, `/me`, `/pending`, `/help`; approval buttons (Approve / Reject / Needs changes)
   working end to end with a test approval.
4. **Daily database backup** at 2 AM, keeping the last 14 days (plus
   instructions to copy backups to Google Drive).
5. **Master data templates** + sample data filled in for a demo.
6. **Automated tests** for login, roles, approvals, audit, import, test mode.
7. **Simple guide:** `docs/SETUP_GUIDE.md`, "How to start Vbays on your computer, step by step".

**Your acceptance test for Phase 1:** log in as Owner → create a Sales user →
import the sample rate card → create a test approval → approve it from
Telegram → see it in the audit log → confirm nothing appeared anywhere
outside (outbox shows "TEST").

---

## 8. Fully automatic posting, no third parties (Phase 2 design)

Vbays talks **directly** to the official APIs. No Buffer, Upload-Post,
Zapier or similar.

```
Google Drive folder ──▶ Vbays media inbox (Claude checks quality, tags room/style)
                              │
Weekly plan (Claude) ──▶ Vbays video maker (FFmpeg: 9:16 Reels, 16:9 YouTube)
                              │
                     Telegram to owner: [✅ Approve] [✏️ Edit] [🔄 Redo] [❌ Reject] [🕒 Reschedule]
                              │ approved
                              ▼
            Vbays scheduler posts at the chosen time
            ├── Instagram Graph API (official, Meta): Reels, carousels, posts
            └── YouTube Data API v3 (official, Google): Shorts + long videos
                              │
            Comments/DMs read back ▶ replies from knowledge files ▶ leads into CRM
```

**"Automatic" and your approval rule.** Your Part 2 rule says nothing is
posted without approval. So Vbays does everything automatically **up to**
one Telegram tap from you, and **everything after** the tap. If you want,
we can later allow some content (e.g. "Tip of the Day") to publish with no
tap, using the `auto_publish_marketing` setting, but only if you choose to.

**What the platforms require (free, but takes time):**

| Platform | Requirement | Notes |
|---|---|---|
| Instagram | Business account + a Meta developer app | Posting to **your own** account works while the app is in development mode. No Meta app review is needed just for you. |
| Instagram | Photos/videos must be at a **public web address** when posting | Instagram downloads the file from our server. So auto-posting needs Vbays online (a small cloud server, ~₹500–1,000/month), or at least a temporary public link. |
| YouTube | Google Cloud project with YouTube Data API v3 | Free quota is about 6 uploads per day, more than we need. |
| YouTube | **API audit by Google** | Until Google approves our project (free form, usually 1–4 weeks), videos uploaded through the API stay **private**. We apply at the start of Phase 2. |

Because of the public-address requirement, I suggest we **move Phase 10's
hosting earlier**: set up the small cloud server during Phase 2.

## 9. Running cost (Phase 1 only)

| Item | Cost |
|---|---|
| PostgreSQL (your PC via Docker, or Supabase free tier) | ₹0 |
| Telegram bot | ₹0 |
| Claude API (Phase 1 uses almost none) | ~₹0–100/month |
| Hosting | ₹0 while testing on your PC (hosting is decided in Phase 10) |

---

## 10. Questions for you (answer when you can)

**Naming**
1. Is the app name **"Vbays"** and the company **"Avina Interiors"**? Or is
   *Vbays* the company name too? (I assumed Vbays = the app, Avina
   Interiors = the company, from your repository.)

**Business facts (from PART 1)**
2. Default customer language: Telugu, English, or Telugu-English mix?
3. Real WhatsApp business number, and is it already used in the WhatsApp
   Business *app*? (Moving a number to the Cloud API removes it from the
   phone app. A **new number** is often easier.)
4. Team: how many people in each role (sales, designers, factory manager,
   factory staff, supervisors, accounts)? Do factory staff have smartphones
   with Telegram?
5. Payment milestones: is it 10 / 50 / 35 / 5?
6. Factory stages: is it Cutting → Edge banding → Drilling → Assembly → QC →
   Packing → Dispatch?
7. Design software used at the factory (e.g. SketchUp, Cabinet Vision,
   Polyboard, KD Max, AutoCAD)? Can it export a cutting list as CSV/Excel?
8. Accounting: Tally Prime, Zoho Books, or Excel? Do you want a Tally import
   file (XML) or just Excel?
9. Discount limit: sales can give up to what %, before the owner must approve?
10. Monthly volume: roughly how many leads and projects per month?
11. Are the website numbers real (12+ years, 2,400+ projects, 10-year
    warranty, starting prices)? Some look like placeholders.

**Technical**
12. Instagram needs a public web address to post from (see §8). Shall we set
    up a small **cloud server** (~₹500–1,000/month) during Phase 2? If so,
    do you prefer a provider (e.g. DigitalOcean, Hetzner, AWS Lightsail,
    Hostinger VPS)?
13. Database: local PostgreSQL (Docker) or **Supabase free tier**? (Free
    Supabase pauses after a week of no use, fine for testing.)
14. Admin panel: I built simple mobile-friendly pages (see screenshots).
    Happy with them, or do you prefer Streamlit?
15. Do you already have a Telegram bot token (from @BotFather) and a Claude
    API key? (If not, the setup guide will walk you through it.)
16. Do you want the optional **Marketing** role (for a freelancer/agency who
    must not see customer data)?
17. Posting: keep **one Telegram tap per post** (default), or allow some
    content types (e.g. Tip of the Day) to post with no tap?

Reply with your answers (short answers are fine, e.g. "2: Telugu-English
mix"). Anything you skip, I'll use the default shown here and list it
clearly.
