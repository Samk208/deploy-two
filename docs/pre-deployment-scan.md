# Pre-deployment Scan Report

- Total files scanned: 51 API routes, middleware, app/layout, header, global CSS
- TypeScript errors found: 0 (pnpm tsc --noEmit)
- Broken imports: None detected during build and type-check
- Missing components: None detected
- API routes status: 51 route handlers present, compiled successfully
- Middleware status: Compiles; enforces CORE_FREEZE and SHOPS_FREEZE on writes
- Environment variables status:
  - .env.local: present
  - Required (verify on Netlify): SHOPS_FREEZE, CORE_FREEZE, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_TELEMETRY_DISABLED
- Build status: SUCCESS (next build)
- Dev server status: RUNNING (started with freezes enabled)

Recommended fixes:
- None blocking. Keep freezes enabled in production until post-deploy verification.
