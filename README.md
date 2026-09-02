# Avina Interiors — Website

A premium, animated, SEO-optimised website for Avina Interiors, an interior
design company in Visakhapatnam (Vizag), Andhra Pradesh. Built with
Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Framer Motion.

> This repo also hosts **D.Interactive**, a separate learning-platform
> product, entirely under `/platform`. See
> [D.Interactive — Digital Interactive Learning Platform](#dinteractive--digital-interactive-learning-platform)
> below for what it is and how to run it.

## What's included

- **11 page types**: Home, About, Services (list + detail), Portfolio (list +
  detail, with category filtering), Gallery, Testimonials, Blog (list +
  detail), Contact, 404.
- **Lead generation**: floating WhatsApp button on every page, a WhatsApp-first
  contact form, click-to-call links, and CTAs throughout.
- **SEO**: per-page metadata, Open Graph/Twitter cards, `LocalBusiness` +
  `FAQPage` + `BreadcrumbList` JSON-LD structured data, `sitemap.xml`,
  `robots.txt`, and a web manifest.
- **Social integration UI**: Instagram feed grid, YouTube/Reels showcase, and
  a Google Reviews section — see [Connecting live social feeds](#connecting-live-social-feeds)
  to wire these to your real accounts.
- **Design system**: a warm ivory/charcoal/brass palette, Playfair Display +
  Manrope typography, and scroll-triggered Framer Motion animations.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Editing content

Almost everything on the site is driven by plain data files in `src/data/` —
edit these instead of hunting through components:

| File | Controls |
|---|---|
| `src/data/site.ts` | Business name, phone, WhatsApp number, email, address, map, social links, Google rating, analytics IDs |
| `src/data/services.ts` | The 8 services shown on `/services` |
| `src/data/projects.ts` | Portfolio projects shown on `/portfolio` |
| `src/data/testimonials.ts` | Client testimonials/reviews |
| `src/data/faqs.ts` | FAQ accordion (home + contact + services) |
| `src/data/blog.ts` | Blog posts |
| `src/data/team.ts` | About page team, milestones, values |
| `src/data/nav.ts` | Header navigation links |

### 1. Update your business details (do this first)

Open `src/data/site.ts` and replace the `TODO` values:

- `phone` / `whatsappNumber` — your real number. `whatsappNumber` must be
  digits only with country code, e.g. `919876543210`.
- `email`, `address`, `googleReviewLink`
- `social` — your real Instagram/Facebook/YouTube/LinkedIn URLs

### 2. Replace placeholder imagery

Every photo on the site (hero, services, portfolio, gallery, blog) is
currently an elegant gradient placeholder (`PlaceholderImage` component) so
the site works out of the box without stock photography. To use your real
project photos:

1. Add images to `public/images/...`.
2. Swap the relevant `<PlaceholderImage tone="..." label="..." />` usage for
   Next's `<Image src="/images/your-photo.jpg" ... fill />` component.
3. For the portfolio/gallery grids, you can keep the same grid markup and
   just replace the `PlaceholderImage` call per item.

## Connecting live social feeds

The Instagram, YouTube and Google Reviews sections currently show curated,
static content so the layout looks production-ready without any API keys.
To make them live:

**Instagram** (`src/components/social/InstagramFeed.tsx`)
- Easiest: embed a widget from [SnapWidget](https://snapwidget.com),
  [Elfsight](https://elfsight.com), or [Behold.so](https://behold.so) and
  drop their embed code in place of the grid.
- Or use the [Instagram Graph API](https://developers.facebook.com/docs/instagram-platform)
  with a Business/Creator account and fetch posts server-side in a Server
  Component, caching with `revalidate`.

**YouTube** (`src/components/social/VideoShowcase.tsx`)
- Replace each tile with a real `<iframe src="https://www.youtube.com/embed/VIDEO_ID">`
  once you have project walkthrough videos uploaded.

**Google Reviews** (`src/components/social/GoogleReviews.tsx`)
- Easiest: embed a widget from Elfsight/EmbedSocial.
- Or use the [Google Places API](https://developers.google.com/maps/documentation/places/web-service/place-details)
  (Place Details `reviews` field) from a server route, since it requires a
  server-side API key.

## Connecting the contact form

The `/contact` form (`src/components/contact/ContactForm.tsx`) works with
**zero backend** — on submit it opens a pre-filled WhatsApp chat to your
business number, which is the fastest-converting channel for Indian
home-services leads. To also capture leads by email:

- Quick option: point the form at [Formspree](https://formspree.io) or
  [EmailJS](https://www.emailjs.com) (no server code needed).
- Custom option: add a Next.js Route Handler (`src/app/api/lead/route.ts`)
  that calls your email provider (Resend, SendGrid, etc.) and call it from
  `handleSubmit` alongside the WhatsApp redirect.

## Map

`siteConfig.mapEmbedSrc` in `src/data/site.ts` uses a simple query-based
Google Maps embed (no API key required). For a pin-accurate embed, go to
Google Maps → your location → Share → Embed a map, and paste the `src`
value from the generated `<iframe>`.

## Analytics & tracking

Fill in `googleAnalyticsId`, `googleAdsConversionId` or `metaPixelId` in
`src/data/site.ts`, then wire them into `src/app/layout.tsx` using
[`next/script`](https://nextjs.org/docs/app/api-reference/components/script)
(e.g. Google tag / gtag.js, Meta Pixel base code). Left blank, no tracking
scripts are loaded.

## SEO checklist before going live

- [ ] Update `siteConfig.url` in `src/data/site.ts` to your production domain
- [ ] Replace `public/favicon.ico` with your brand mark
- [ ] Add a real Open Graph image at `public/og-image.jpg` (1200×630)
- [ ] Verify the site in [Google Search Console](https://search.google.com/search-console) and submit `/sitemap.xml`
- [ ] Create/claim your [Google Business Profile](https://business.google.com) for the `LocalBusiness` schema and reviews to show correctly
- [ ] Swap placeholder imagery for real, compressed project photos (see above)

## Deployment

The easiest path is [Vercel](https://vercel.com/new) (built by the Next.js
team): connect this GitHub repo and it will detect Next.js automatically —
no configuration needed. Any Node.js host that supports Next.js (Netlify,
Render, a VPS with `next start`) also works.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for scroll/entry animations
- [lucide-react](https://lucide.dev) + [react-icons](https://react-icons.github.io/react-icons/) for iconography

---

## D.Interactive — Digital Interactive Learning Platform

`/platform` is a second, independent product living in this same Next.js
app: a multi-tenant, multi-school learning platform for Class 1–10 that
turns textbook chapters into hands-on, drag-and-drop interactive labs. It
has its own visual language (`.platform-theme` in `globals.css`, Baloo 2
font), its own app shell (`src/app/platform/layout.tsx`), and never renders
the Avina Interiors marketing chrome (see `SiteChrome.tsx`, which hides the
Navbar/Footer/WhatsApp button for any `/platform/*` route).

### Try it

```bash
npm install
npm run dev
```

Open [http://localhost:3000/platform](http://localhost:3000/platform) and
pick a role. Quick demo logins:

| Role | How to enter |
|---|---|
| Student | Login screen → Student tab → "Go" on the featured student card (Aarav Patel, Class 6A, Sunrise Public School) |
| Teacher | Login screen → Teacher tab → name **Priya Sharma**, subject Science, school Sunrise Public School |
| Principal / Admin | Login screen → Admin tab → name **Krishna Murthy**, school Sunrise Public School |
| Super Admin | Login screen → Super Admin tab → Enter |

Typing any other name/class/section (or subject/school) creates a brand
new demo account on the fly — there's no real authentication backend, so
anything you type "logs in."

### What's implemented

- **Auth & multi-tenant structure** — role-based login (Student/Teacher/
  Admin/Super Admin), 3 seeded demo schools with isolated rosters.
- **Student dashboard** — subject cards, interactive labs, assignments
  (Pending/Submitted/Graded), progress (XP, levels, streaks, badges),
  Ask Teacher.
- **Teacher dashboard** — overview, assignment creation + grading
  (auto-graded quizzes/labs, manual grading for written/project work),
  per-class/per-student performance analytics with at-risk flags,
  class announcements + doubt replies.
- **Admin/Principal dashboard** — school overview, teacher table (subject,
  classes, class average, grading turnaround), student table with
  Good/Average/Needs Attention status, auto-flagged alerts, CSV report
  exports (student performance, teacher summary, assignment completion —
  these are real, working downloads, not mocked).
- **Super Admin console** — platform-wide stats, school onboarding form.
- **The reusable Interactive Lab Engine** (`src/components/platform/
  lab-engine/`) — one engine, driven entirely by the JSON schema described
  in the product spec (`src/platform/types.ts` → `LabContent`), renders
  all 6 seed labs across Science, Maths, English, Telugu and Social
  Studies. All 5 interaction types from the spec are implemented with real
  drag gestures (Framer Motion `drag` / `Reorder`), instant visual +
  audio feedback, unlimited retries, and a completion celebration with
  confetti, XP and badges:
  - **Drag-Mix** — `DragMix.tsx` (Science: acid-base reactions)
  - **Drag-to-Count** — `DragCount.tsx` (Maths: counting into a basket)
  - **Drag-to-Match** — `DragMatch.tsx` (English/Telugu vocabulary,
    Social Studies states & capitals)
  - **Drag-to-Sequence** — `DragSequence.tsx` (Social Studies: water cycle)
  - **Drag-to-Label** — `DragMatch.tsx` in label mode (Science: parts of
    a plant)
- **Content Pipeline (Module 6)** — a *simulated* PDF → lab pipeline at
  `/platform/teacher/content-pipeline`: pick a subject/class/topic (a real
  file picker is there for the demo, but the PDF isn't actually parsed),
  watch the extraction/segmentation/generation steps animate, then review
  and edit the generated draft before publishing it to students. See
  "What's simulated" below for how to wire in the real thing.
- **Gamification** — XP, levels, streak display, a badge catalog, and
  celebratory (never harsh) feedback per the spec's game rules.
- **Sound** — every pickup/drop/correct/incorrect/completion cue is
  synthesized on the fly with the Web Audio API (`src/platform/lib/
  sound.ts`) rather than shipped as audio files, so the whole engine has
  zero binary asset dependencies. Swap in real recorded SFX by replacing
  `playSound()`'s internals.

### What's simulated / mocked (by design, for this demo build)

This is a front-end-only build: there is no database and no server. State
lives in a React context (`src/platform/store.tsx`) seeded from
`src/platform/data/*.ts` and persisted to the browser's `localStorage` so
a reload doesn't lose your progress. To turn this into the production
system described in the spec:

- **Auth** — replace `loginStudent`/`loginTeacher`/`loginAdmin` in
  `store.tsx` with real JWT-based auth + OTP/SSO; today any typed name
  "logs in" or silently creates an account.
- **Database** — replace the `localStorage`-persisted reducer with real
  API calls to Postgres (users/schools/grades) + MongoDB (lab content),
  per the spec's suggested stack.
- **PDF → Lab pipeline** — `src/platform/lib/pdfPipeline.ts`'s
  `generateMockLab()` deterministically fabricates plausible items from a
  typed-in topic name. Replace it with real PDF/OCR text+image extraction
  and an LLM concept-extraction pass, keeping the same `LabContent` output
  shape so the Lab Engine and review UI need no changes.
- **Notifications** — email/SMS delivery (Module 11) isn't wired up; only
  in-app announcements/doubts exist.
- **Reports** — CSV exports are real; formatted PDF export would need a
  server-side renderer.

### Where things live

```
src/platform/            Domain layer (framework-agnostic)
  types.ts                All shared types, incl. the reusable LabContent schema
  store.tsx               App state: React context + reducer + localStorage persistence
  nav.ts                  Per-role sidebar navigation
  data/                   Seed data: schools, users, labs, assignments, announcements, badges
  lib/                    sound.ts, gamification.ts, pdfPipeline.ts, csv.ts

src/components/platform/ UI layer
  PlatformShell.tsx        Sidebar + topbar dashboard chrome
  RoleGuard.tsx             Route protection per role
  ui.tsx                    Shared primitives (cards, buttons, badges, stat tiles)
  LoginScreen.tsx, LabsBrowser.tsx, LabRunner.tsx
  lab-engine/               The reusable Interactive Lab Engine + all interaction types

src/app/platform/        Routes (thin — pages compose the above)
  page.tsx                  Landing page
  login/                    Role-tabbed login
  student/  teacher/  admin/  super-admin/
```
