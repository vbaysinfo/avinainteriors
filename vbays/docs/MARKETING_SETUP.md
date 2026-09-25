# Vbays Marketing Autopilot: Setup & Daily Use (Phase 2)

## What runs by itself

| When (India time) | What Vbays does |
|---|---|
| Every 30 min | Picks up new photos/videos from your **Google Drive folder** and from photos staff **send to the Telegram bot**. Checks each one and rejects blurry, dark or private shots. |
| Sunday 6 PM | **Plans next week**: Reels, carousels, a long YouTube video and LinkedIn posts, mixed across project showcase, before/after, factory process, tips, cost guides and material comparisons. |
| Up to 2 days before each post | **Writes** the hook, script, caption, 15–20 hashtags, call to action and YouTube SEO, **fact-checks** it against your knowledge files, then **makes the video** (9:16 or 16:9, zoom, transitions, Telugu/English text, subtitles, logo, intro/outro, voiceover, music) or the carousel images, plus a thumbnail. |
| At the planned time | **Posts** it: Instagram Reel/carousel, YouTube Short/video. You get a Telegram message with the link. |
| LinkedIn | Sends you the post on Telegram with **✅ Approve / ❌ Reject / ✏️ Needs changes**. It posts only after you tap ✅. |
| Every 15 min | Reads **comments and Instagram DMs**. Enquiries become **leads**, and sales gets a 🔥 Telegram alert. Simple questions get an automatic reply using only your knowledge files. **Complaints, angry messages and price negotiation always go to a person.** |
| 11 PM daily | Collects followers, likes, comments and views. |
| Monday 9 AM | **Weekly report** on Telegram. The insights feed into next week's plan. |
| 3 AM daily | Renews the Instagram login and warns you before the LinkedIn login expires. |

### Safety brakes (always on)
- **Pause everything:** send `/pause` to the Telegram bot, or press **Pause posting** on the Marketing page. `/resume` starts it again.
- A post goes to you on Telegram **instead of** posting by itself if:
  - the AI isn't connected,
  - the fact check found a claim that isn't in your knowledge files, or
  - information was missing, such as a price you never gave.
- Photos with **people** are only used after you tick *Customer consented* in the Media library. Photos showing house numbers, name boards or car plates are rejected.
- Instagram allows up to 25 API posts a day. Vbays stops at 20.
- Every post and reply is in the **Outbox** and the **Audit log**.

---

## One-time setup

Do these in order. Each step says roughly how long it takes.

### 1. Business details (5 min)
Vbays → **Settings**:
- `business_phone`: your WhatsApp number. It's used in captions, replies and the video end card.
- Check `website`, `tagline` and the posting rules (`platform_policy_*`).
- How many posts a week: `ig_reels_per_week`, `ig_carousels_per_week`, `yt_long_videos_per_week`, `linkedin_posts_per_week`.

Put your **logo** (transparent PNG) at `storage/brand/logo.png`. Put royalty-free **music** (`.mp3`) in `storage/music/`; use tracks you have the right to use, e.g. from the YouTube Audio Library.

### 2. Claude AI key (10 min): needed for automatic posting
<https://console.anthropic.com> → API Keys → create a key → in `.env`: `ANTHROPIC_API_KEY=...`.
Without a key, Vbays still plans and makes content, but **every post waits for your ✅**, because nothing can be fact-checked.

### 3. Instagram (30 min + Meta checks)
1. Instagram must be a **Business** account (see `phase0/QUICKSTART.md` step 2).
2. <https://developers.facebook.com> → **My Apps → Create app** → type **Business**.
3. In the app, add the **Instagram** product → **API setup with Instagram login**.
4. **Add account** → log in with the Avina Interiors Instagram.
5. Press **Generate token** and copy it.
6. Vbays → **Marketing → Connections → Instagram** → paste the token → **Connect**.

**Instagram needs Vbays online.** Instagram downloads each video from a public `https://` address. Posting to Instagram therefore only works once Vbays is hosted on a server with `BASE_URL=https://your-domain` in `.env`. YouTube and LinkedIn also work from your own computer.

**About replying to Instagram DMs from the public:** Meta usually requires **App Review** of the `instagram_business_manage_messages` permission (free, takes 1–4 weeks). Until then, DM replies may fail. Vbays then shows them as "needs a person" instead. Comment replies on your own posts work with your own account.

### 4. YouTube + Google Drive (30 min + Google audit)
1. <https://console.cloud.google.com> → create a project, e.g. "Vbays".
2. **APIs & Services → Library** → enable **YouTube Data API v3** and **Google Drive API**.
3. **OAuth consent screen** → External → fill the app name and your email → add yourself as a test user.
4. **Credentials → Create credentials → OAuth client ID** → **Web application**.
   Authorized redirect URI: the one shown on Vbays → Marketing → Connections, e.g. `http://localhost:8000/marketing/connect/google/callback`.
5. Copy the Client ID and Secret into `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and restart.
6. Make a Drive folder, e.g. "Vbays Media". Open it, and copy the last part of the web address into `.env` as `GOOGLE_DRIVE_FOLDER_ID`. You can make one sub-folder per project, e.g. "Rao villa – kitchen after". The folder name becomes the project note.
7. Vbays → Marketing → Connections → **Connect Google** → choose the account that owns the YouTube channel → allow.

**Important:** until Google **audits** your project, YouTube keeps videos uploaded through the API **private**. Apply at *YouTube API Services – Audit and Quota Extension Form* (free, usually 1–4 weeks). Also publish the OAuth consent screen to "In production" so the login doesn't expire every 7 days.

### 5. LinkedIn (20 min)
1. <https://www.linkedin.com/developers> → **Create app**. It needs a LinkedIn Company Page; use Avina Interiors.
2. **Products** tab → add **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**.
3. **Auth** tab → add the redirect URL shown on Vbays → Marketing → Connections.
4. Copy the Client ID and Secret into `.env` (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`) and restart.
5. Vbays → Marketing → Connections → **Connect LinkedIn**.

Posts go to **your personal profile**. Posting as the Company Page needs LinkedIn's *Community Management API* approval; we can add that later.

### 6. Telegram (already done in Phase 1)
Make sure the owner and sales staff have linked Telegram (Staff page → Telegram code).

### 7. Switch on
1. **Modules** → Marketing (M01) → **ON**. It starts in **TEST**: everything is made, but only recorded in the Outbox.
2. Watch it for a few days: Marketing page, Outbox, Leads.
3. When happy, set `TEST_MODE=false` in `.env`, restart, and switch Marketing to **LIVE** in Modules. Both locks must be open before anything is really posted.

---

## Daily use (almost nothing)
- **Send photos/videos** of finished sites and factory work to the Telegram bot, or drop them in the Drive folder. Add a caption like "MVP Colony 3BHK kitchen after". That's the most useful thing your team can do.
- **Tap ✅** on LinkedIn posts, and on anything the fact check flagged.
- **Reply to 🙋 alerts** (complaints, negotiations) yourself.
- Follow up on the **🔥 lead alerts**. In Phase 3 the WhatsApp agent will do the first follow-ups for you.

## Try it without any accounts
```
python -m app.cli demo-marketing
```
This makes demo pictures, plans the week, makes a Reel, a carousel and a LinkedIn post, "posts" them in test mode, and turns sample comments into leads. Then open **Marketing**, **Leads** and **Outbox**.

## Running cost for marketing

| Item | Monthly cost (estimate) |
|---|---|
| Instagram, YouTube, LinkedIn, Google Drive, Telegram APIs | ₹0 |
| Claude API (planning, writing, fact checks, photo checks, replies) with `claude-opus-5` | about ₹1,500–4,000 at ~30 posts + ~300 comments a month; about half with `claude-sonnet-5` |
| Voiceover (Microsoft Edge voices) | ₹0 |
| Server, needed for Instagram posting (1–2 GB RAM VPS) | about ₹500–1,200 |

These are estimates. Check your real Claude usage at console.anthropic.com after the first month.
