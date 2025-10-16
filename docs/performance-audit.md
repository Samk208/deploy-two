# Mobile Performance Audit (Non-Breaking)

Date: 2025-10-15

Scope: Safe optimizations only. No API/auth/database logic changes.

## Findings

- NEXT Telemetry: Not explicitly disabled. Recommendation: set `NEXT_TELEMETRY_DISABLED=1` in deployment environment.
- Images:
  - Next.js Image remotePatterns configured in `next.config.mjs` for Unsplash, Picsum, and Supabase storage (http in dev, https in prod). Formats include AVIF/WEBP. Device sizes present.
  - Many components already import `next/image`. Some legacy `<img>` usage remains in a few UI areas (e.g., avatar fallback in `components/layout/header.tsx`).
- Fonts:
  - Using `next/font/google` Inter with `display: 'swap'` in `app/layout.tsx`.
- Bundle size/build:
  - Build completed successfully (Next.js 15.2.4). No critical bundle size warnings in output. Shared first load ~102 kB, most pages 110–195 kB.
- Heavy libraries on mobile routes: No `moment`, `lodash`, `three`, `mapbox`, `leaflet`, or `d3` detected. Charts usage is localized (`recharts`) and only appears on dashboards.
- Google Translate:
  - Widget is client-only via `components/global/GoogleTranslate.tsx` (`use client`, `useEffect` mount gate). Exclusions in place for `/api/**`, `/sign-in`, `/sign-out`, `/admin/**`, `/checkout/**`. Script loaded `afterInteractive`. Root layout mounts component; header wraps in error boundary.

## Recommendations (Safe, Non-breaking)

1. Environment/Build
   - Ensure `NEXT_TELEMETRY_DISABLED=1` is set in production and CI.
   - Keep TypeScript and ESLint checks in place (already enabled in `next.config.mjs`).

2. Images
   - Prefer `next/image` for all product/user images. Replace remaining `<img>` avatars with `next/image` where feasible, preserving layout/size.
   - Confirm all remote image domains are covered by `remotePatterns` (add any missing CDNs discovered during QA).
   - Maintain AVIF/WEBP formats and caching headers (already configured for `/_next/image`).

3. Fonts
   - Already using Inter with `display: swap`. If adding additional fonts, use `next/font` with `display: 'swap'`.

4. Code-splitting/Bundle Hygiene
   - Keep charts (`recharts`) off public/mobile-first pages; only load where needed (current usage aligns with dashboards).
   - Avoid adding large general-purpose libraries; prefer targeted utilities or tree-shaken alternatives.

5. Google Translate (Safety)
   - No changes required. Current implementation is client-only, excludes sensitive routes, and is isolated to avoid DOM conflicts.
   - Test matrix added/verified via Playwright e2e: public loads, auth/admin/checkout excluded, API routes excluded.

## Verification Checklist

- Sign in form works with widget excluded: PASS (e2e updated).
- Sign out flow works: PASS (existing tests; GT not interfering).
- Checkout flows unaffected: PASS (GT excluded).
- API routes never load widget: PASS (e2e added).
- Admin pages work correctly: PASS (GT excluded).
- Lighthouse (manual step): Run against mobile; target LCP < 2.5s, TBT < 200ms, CLS < 0.1.

## Follow-ups (Optional, non-breaking)

- Audit remaining `<img>` usages and migrate to `next/image` if not already (maintain styles and sizes).
- Consider preloading hero image on the home page (Next Image priority) if LCP image is known and stable.
- Periodically run Lighthouse CI on preview deployments for regression alerts.
