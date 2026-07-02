# Avina Interiors — Website

A premium, animated, SEO-optimised website for Avina Interiors, an interior
design company in Visakhapatnam (Vizag), Andhra Pradesh. Built with
Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Framer Motion.

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
