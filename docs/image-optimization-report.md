# Image Optimization Report

- Total Image components found: 27 files reference Image or <img>
- Images missing alt text: Some avatar <img> tags in header and menus use dynamic alt; ensure non-empty alt where possible.
- Images needing priority prop: Likely hero/above-fold images on landing pages (e.g., app/page.tsx) — review for `priority`.
- Raw <img> tags to convert: avatar images in header and mobile menu; consider `next/image` if sizes are known and stable.
- Remote patterns configured: Yes (images.unsplash.com, picsum.photos, api.dicebear.com, Supabase host, local dev).

Recommendations:
- Ensure all `Image` usages include meaningful `alt`.
- Add `priority` to above-the-fold hero/product lead images.
- Convert raw avatar <img> to `next/image` where layout constraints allow.
- Validate `sizes` props for responsive layouts.
