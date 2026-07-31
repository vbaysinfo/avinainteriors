# Avina Interiors — Website

A premium, animated, SEO-optimised website for Avina Interiors, an interior
design company in Visakhapatnam (Vizag), Andhra Pradesh. Built with
Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Framer Motion.

## What's included

- **Pages**: Home, Services (list + detail), Portfolio (with category
  filtering and an image popup/lightbox per project), Testimonials, Contact,
  404.
- **Lead generation**: floating WhatsApp button on every page, a WhatsApp-first
  contact form, click-to-call links, a sq.ft cost estimator popup, and CTAs
  throughout.
- **SEO**: per-page metadata, Open Graph/Twitter cards, `LocalBusiness` +
  `FAQPage` + `BreadcrumbList` JSON-LD structured data, `sitemap.xml`,
  `robots.txt`, and a web manifest.
- **Social integration UI**: Instagram feed grid — see
  [Connecting live social feeds](#connecting-live-social-feeds) to wire it to
  your real account.
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
| `src/data/site.ts` | Business name, phone (x2), WhatsApp number, email, address, map, social links, Google rating, analytics IDs, Google Sheets webhook URL |
| `src/data/estimator.ts` | `PRICE_PER_SQFT` — the single rate used by the "Calculate Now" popup |
| `src/data/services.ts` | The 8 services shown on `/services` |
| `src/data/projects.ts` | Portfolio projects shown on `/portfolio` |
| `src/data/testimonials.ts` | Client testimonials/reviews |
| `src/data/faqs.ts` | FAQ accordion (home + contact + services) |
| `src/data/blog.ts` | Blog posts |
| `src/data/team.ts` | About page team, milestones, values |
| `src/data/nav.ts` | Header navigation links |

### 1. Update your business details (do this first)

Open `src/data/site.ts` and replace the `TODO` values:

- `phone` / `phone2` / `whatsappNumber` — your two business lines and your
  WhatsApp number. `whatsappNumber` must be digits only with country code,
  e.g. `919876543210`. Both `phone` and `phone2` are shown, click-to-call, in
  the header, footer, Contact page and the estimator's confirmation screen.
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
3. For the portfolio grid, you can keep the same grid markup and just
   replace the `PlaceholderImage` call per item.

## Connecting a live Instagram feed

The Instagram section (`src/components/social/InstagramFeed.tsx`) currently
shows curated, static content so the layout looks production-ready without
any API keys. To make it live:
- Easiest: embed a widget from [SnapWidget](https://snapwidget.com),
  [Elfsight](https://elfsight.com), or [Behold.so](https://behold.so) and
  drop their embed code in place of the grid.
- Or use the [Instagram Graph API](https://developers.facebook.com/docs/instagram-platform)
  with a Business/Creator account and fetch posts server-side in a Server
  Component, caching with `revalidate`.

## The "Calculate Now" cost estimator

The Home page hero's **Calculate Now** button (`src/components/home/Hero.tsx`)
opens a simple popup (`src/components/estimator/CalculateNowModal.tsx`): the
visitor picks a service type (Full Modular or Semi Modular), enters their
space's area in square feet, sees a live-computed estimate, then fills in
name/phone/email to submit. It shows a summary with the estimated cost plus
one-tap call and WhatsApp buttons, and pushes the lead to your Google Sheet
(see below).

Pricing is `sq.ft × pricePerSqFt` for the selected service type. Edit
`serviceTypes` in `src/data/estimator.ts` to change the rates (currently
₹1,600/sq.ft for Full Modular, ₹900/sq.ft for Semi Modular) or add more
tiers. The estimate is explicitly labelled in the UI as approximate, not a
final quote.

## Saving leads to Google Sheets

Both the Calculate Now popup and the Contact page form call
`submitLead()` (`src/lib/leads.ts`), which posts `{ timestamp, name, phone,
email, bhkType, roomsSelected, package, notes, source }` to
`siteConfig.googleSheetsWebAppUrl`. Leave it blank and this step is skipped
— leads still arrive via the WhatsApp/call fallback built into both forms.

To wire it up to the shared
[Google Sheet](https://docs.google.com/spreadsheets/d/1NCJZjsah1UONx3uvQ5JB-eJhgnkhesxMw6iv_RXPIwA/edit):

1. Open the sheet → **Extensions → Apps Script**.
2. Add columns to row 1 if not already present: `Timestamp | Name | Phone | Email | BHK Type | Rooms Selected | Package | Notes | Source Page`.
3. Paste a `doPost(e)` function that parses `e.postData.contents` as JSON and
   appends a row with `SpreadsheetApp.getActiveSheet().appendRow([...])` in
   the same column order. Optionally call `MailApp.sendEmail(...)` here too,
   to also email a copy of every submission to `vbaysinfo@gmail.com`.
4. **Deploy → New deployment → Web app**, execute as *Me*, access *Anyone*.
5. Copy the deployment's Web app URL into `siteConfig.googleSheetsWebAppUrl`
   in `src/data/site.ts`.

Requests are sent with `mode: "no-cors"` (Apps Script web apps don't return
CORS headers), so the response body is opaque by design — this is
fire-and-forget and never blocks the WhatsApp/call fallback.

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
