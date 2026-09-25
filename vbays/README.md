# Vbays — AI Business Automation System for Avina Interiors

**Vbays** is the all-in-one AI business system for **Avina Interiors**, an
interior design company with its own modular furniture factory, based in
Visakhapatnam.

The public website lives in the rest of this repository (`src/`). Everything
for the business system lives in this `vbays/` folder, so the two never get
in each other's way.

## Build status

| Phase | What | Status |
|---|---|---|
| 0 | Quick start: Claude Desktop Project (drafting); no third-party posting tools | ✅ Ready — see `phase0/QUICKSTART.md` |
| 1 | Architecture, database, logins/roles, data import, Telegram bot, admin panel | ✅ Built & tested — see `docs/SETUP_GUIDE.md` |
| 2 | M1 Marketing: direct Instagram + YouTube posting (official APIs) | ⏳ Next |
| 3 | M2 WhatsApp Sales Agent + M3 CRM | ⏳ |
| 4 | M4 Site visit & measurement + M5 Quotation | ⏳ |
| 5 | M6 Orders & payments | ⏳ |
| 6 | M7 Factory + M8 Inventory & purchase | ⏳ |
| 7 | M9 Site execution + M10 Handover & after-sales | ⏳ |
| 8 | M11 Staff tasks + M12 Owner dashboard & AI assistant | ⏳ |
| 9 | M13 Your own MCP server for Claude Desktop | ⏳ |
| 10 | Hosting, security review, backups, final testing | ⏳ |

## What's in this folder

```
vbays/
├── app/                 the Vbays program (Python)
│   ├── core/            logins, roles, approvals, outbox, audit, AI, backups
│   ├── integrations/    Telegram (Instagram, YouTube, WhatsApp come later)
│   ├── modules/         the 13 business modules (switch on/off)
│   └── web/             admin website pages
├── knowledge/           the ONLY facts the AI may tell customers
├── master_data/         Excel/CSV templates (with SAMPLE rows)
├── phase0/              Claude Desktop Project instructions + quick start
├── docs/                architecture, setup guide
├── tests/               automatic tests
├── .env.example         settings template (copy to .env)
└── docker-compose.yml   one-command start
```

**Start here:** `docs/SETUP_GUIDE.md`.

## Safety built in
- **TEST MODE** is on by default: nothing reaches customers or social media.
- **Approvals:** nothing goes to a customer or the public without a human "yes".
- **Audit log:** every important action is recorded and can't be edited.
- **Roles:** each person sees only what their job needs.
- **Daily backups** at 2 AM, last 14 days kept.
- All keys live in `.env`, never in the code.
