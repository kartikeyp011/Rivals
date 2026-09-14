# Rivals — Official Website

Public marketing website for the Rivals mobile app.

## Stack
- Next.js 14 (App Router) + TypeScript
- Plain CSS (globals.css) — no CSS framework
- No runtime dependencies beyond React/Next

## Local development
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build
```bash
npm run build
npm run start
```

## Deployment (Vercel)
1. Push this `website/` folder to GitHub.
2. Import the repo into Vercel.
3. Set the **Root Directory** to `website`.
4. Deploy. Done.

## Canonical URL
The placeholder canonical URL is `https://rivals-website.vercel.app`.
Update it in `src/app/layout.tsx` and `src/app/sitemap.ts` after
you attach your real Vercel domain.

## Things to replace before launch
- [ ] Real canonical domain in `layout.tsx` and `sitemap.ts`
- [ ] Real app screenshots (see `PhoneMockup.tsx`)
- [ ] Real OG image (see `public/og-image-placeholder.svg`)
- [ ] Final Privacy Policy copy in `src/app/privacy/page.tsx`
- [ ] Final Terms of Service copy in `src/app/terms/page.tsx`
- [ ] Real support email (currently `kartikeyp011@gmail.com`)
- [ ] Real App Store / Galaxy Store URLs once the app is live