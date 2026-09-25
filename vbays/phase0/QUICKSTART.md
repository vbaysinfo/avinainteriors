# Vbays Phase 0: Start Marketing Today

**Goal:** In about an hour, you can ask Claude Desktop to plan your week,
write Reels and captions in Telugu/English, and (after you say "yes")
schedule posts to Instagram and YouTube.

You need no code and no server. Everything here is free except your Claude
subscription.

---

## What you'll set up

```
 You ──chat──▶ Claude Desktop Project "Vbays"
                 │  • knows your business (instructions + knowledge files)
                 │  • writes drafts, always asks before posting
                 ▼
          Posting connector (choose one or both)
          ├── Buffer (free): Instagram, Facebook, YouTube Shorts
          └── Upload-Post (free tier): also long YouTube videos
                 ▼
       Instagram · Facebook · YouTube
```

---

## Step 1: Get your accounts ready (15 min)

1. **Instagram must be a Business or Creator account.** In the Instagram app:
   Profile → ☰ → Settings → *Account type and tools* → *Switch to
   professional account* → **Business**.
2. **Link Instagram to a Facebook Page** (Buffer and Upload-Post need this
   for reliable Instagram posting). In the Instagram app: *Edit profile* →
   *Page* → connect your Avina Interiors Facebook Page.
3. **YouTube channel:** make sure you can sign in to the Google account that
   owns `@avinainteriors`.

## Step 2: Create the Claude Project (10 min)

1. Install **Claude Desktop** from <https://claude.ai/download> and sign in.
2. Left sidebar → **Projects** → **Create project**. Name it
   `Vbays — Avina Interiors`.
3. Click **Set project instructions** (or *Edit* next to Instructions).
   Open `vbays/phase0/CLAUDE_PROJECT_INSTRUCTIONS.md`, copy everything
   **below the line**, paste, and save.
4. Under **Project knowledge**, click **+ Add content** → upload the 5 files
   from `vbays/knowledge/`:
   `services.md`, `faq.md`, `process.md`, `policies.md`, `brand_guide.md`.
5. **Before uploading**, fill in every `[SQUARE BRACKET]` and check every
   `(confirm)` in those files. The AI will only say what these files say,
   so wrong facts here become wrong posts.

✅ **Test it:** start a chat inside the Project and type:
> Plan this week's Instagram and YouTube content. Mix Telugu and English.

You should get a 7-day table. Nothing is posted yet.

## Step 3: Connect a posting tool (15 min)

### Option A: Buffer (recommended to start)

**Free plan:** 3 channels (for example Instagram + Facebook + YouTube
Shorts), up to 10 posts waiting in each channel's queue. When one posts, a
slot frees up. 1 user. **It does not post long YouTube videos, only Shorts.**

1. Go to <https://buffer.com> → **Get started for free** → sign up.
2. In Buffer, click **Connect channel** → connect **Instagram** (Business),
   **Facebook Page**, and **YouTube** (Shorts).
3. In Claude Desktop: **Settings** → **Connectors** → **Add custom
   connector**.
   - Name: `Buffer`
   - URL: `https://mcp.buffer.com/mcp`
4. Click **Add**, then **Connect**. A Buffer sign-in window opens. Approve it.
5. Open a chat in your Vbays Project. Click the **tools/connectors** icon
   under the message box and make sure **Buffer** is switched on.

✅ **Test it:**
> List my connected Buffer channels.

### Option B: Upload-Post (add this when you need long YouTube videos)

**Free tier:** about 10 uploads per month, no card needed. Supports
Instagram, YouTube (long videos and Shorts), Facebook, TikTok, LinkedIn,
Google Business Profile and more.

1. Sign up at <https://app.upload-post.com>.
2. Connect your Instagram, Facebook and YouTube accounts inside Upload-Post.
3. In Claude Desktop: **Settings** → **Connectors** → **Add custom
   connector**.
   - Name: `Upload-Post`
   - URL: `https://mcp.upload-post.com/mcp`
4. Click **Connect** and sign in when asked.
   - If it asks for an **API key** instead: in Upload-Post go to
     **API Keys** → create one → paste it into Claude. Treat this key like a
     password. Never share it in a chat, email or WhatsApp.

> Your Claude plan may limit how many custom connectors you can add. If you
> can only add one, pick **Buffer** first.

## Step 4: Your daily routine (5–10 min a day)

1. **Monday:** "Plan this week." Adjust the table and reply "approved".
2. **Each day:** attach 3–10 real project or factory photos/videos and say:
   > Make today's Reel from these. Telugu-English mix.
3. Read the draft. Reply with changes, or:
   > Approved. Schedule it on Instagram for [time].
4. Claude will show the final version once more and ask **"Shall I
   schedule this?"** Say **yes** only when you're happy.
5. **Comments/DMs:** paste a comment and ask "Draft a reply." Copy it back
   yourself. (Automatic replies come in Phase 2 and 3.)

### Useful prompts

| Prompt | What you get |
|---|---|
| `Plan this week` | 7-day calendar |
| `Write a Reel: before/after of a 2BHK kitchen in MVP Colony` | Hook, script, on-screen text, caption, hashtags, CTA, time |
| `Carousel: laminate vs acrylic vs PU shutters` | 8–10 slide texts + caption |
| `YouTube video: Cost of a modular kitchen in Vizag 2026` | SEO title, description, tags, chapters, script, thumbnail text |
| `Check these photos for quality` + photos | Which are usable, which to reshoot and why |
| `Shot list for a factory process Reel` | What to film at the factory, shot by shot |

## Safety rules built in

- Claude **always** shows a draft and waits for your "yes" before
  scheduling.
- Claude will **not** invent prices, warranty or offers. Missing facts show
  up as `[NEEDS INFO]`.
- Customer names, faces and house numbers are left out unless you confirm
  consent.

## Costs

| Item | Cost |
|---|---|
| Claude Desktop | Your Claude subscription (Pro recommended for photos + connectors) |
| Buffer free plan | ₹0 |
| Upload-Post free tier | ₹0 (about 10 uploads/month) |
| Instagram / Facebook / YouTube | ₹0 |

## Troubleshooting

| Problem | Fix |
|---|---|
| Claude says it can't post | Check the connector is switched **on** in the chat's tools menu. Reconnect it in Settings → Connectors. |
| Instagram won't connect in Buffer | It must be a **Business** account linked to a **Facebook Page**. |
| Long YouTube video fails on Buffer | Buffer free posts Shorts only. Use Upload-Post for long videos. |
| Claude gives a price you never gave it | Tell it "Only use knowledge files," then fix `services.md` and re-upload it. |

---

**What comes next:** Phase 1 builds the real Vbays system: database, staff
logins, Telegram bot, and admin panel. See `vbays/docs/PHASE1_ARCHITECTURE.md`.
