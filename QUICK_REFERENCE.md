# Quick Reference - Test Commands

## Setup Test Data (Run in Supabase SQL Editor)

```sql
-- 1. Check if test shop exists
SELECT s.id, s.handle, s.name, s.active, s.influencer_id 
FROM shops s 
WHERE s.handle = 'influencer-alex';

-- 2. If not exists, create test shop (adjust IDs as needed)
-- INSERT INTO shops (handle, name, influencer_id, active) 
-- VALUES ('influencer-alex', 'Alex''s Shop', '[YOUR_INFLUENCER_ID]', true);

-- 3. Check curated products
SELECT isp.id, isp.product_id, isp.sale_price, isp.custom_title, isp.published
FROM influencer_shop_products isp
JOIN shops s ON s.influencer_id = isp.influencer_id
WHERE s.handle = 'influencer-alex' AND isp.published = true;

-- 4. Check freeze flag
SELECT name, enabled FROM app.flags WHERE name = 'shops_freeze';
```

---

## Phase 1: UNFROZEN (Terminal Commands)

```powershell
# Set env vars
$env:CORE_FREEZE="false"
$env:NEXT_PUBLIC_CORE_FREEZE="false"
$env:SHOPS_FREEZE="false"
$env:NEXT_PUBLIC_SHOPS_FREEZE="false"
$env:BASE_URL="http://localhost:3000"

# Update DB (run in Supabase)
# UPDATE app.flags SET enabled = false WHERE name = 'shops_freeze';

# Start server (new terminal)
# pnpm dev

# Verify freeze state (browser)
# http://localhost:3000/api/debug/freezes
# Expect: all false

# Run tests
pnpm test:shops-freeze
.\scripts\integration-smoke.ps1

# EXPECT: GETs=200, POSTs=401/403/422 (NOT 423)
```

---

## Phase 2: FROZEN (Terminal Commands)

```powershell
# Set env vars
$env:CORE_FREEZE="true"
$env:NEXT_PUBLIC_CORE_FREEZE="true"
$env:SHOPS_FREEZE="true"
$env:NEXT_PUBLIC_SHOPS_FREEZE="true"

# Update DB (run in Supabase)
# UPDATE app.flags SET enabled = true WHERE name = 'shops_freeze';

# Restart server (Ctrl+C, then pnpm dev)

# Verify freeze state (browser)
# http://localhost:3000/api/debug/freezes
# Expect: all true

# Run tests
pnpm test:shops-freeze
.\scripts\integration-smoke.ps1

# EXPECT: GETs=200, POSTs=423
```

---

## Visual Checks (Browser)

```
# Main shop
http://localhost:3000/shop

# Influencer shop
http://localhost:3000/shop/influencer-alex

# Shop directory
http://localhost:3000/shops

# Freeze debug
http://localhost:3000/api/debug/freezes
```

---

## Lint & Type Check

```powershell
pnpm lint
pnpm typecheck
```

---

## Results Template

Copy-paste this after running tests:

```
## UNFROZEN STATE

Main shop feed:                       [200/XXX]
Influencer feed (influencer-alex):    [200/XXX]
Products listing:                     [200/XXX]
Onboarding submit (POST):             [401/403/422/XXX] ← should NOT be 423
Products create (POST):               [401/403/422/XXX] ← should NOT be 423
Influencer shop add (POST):           [401/403/422/XXX] ← should NOT be 423

## FROZEN STATE

Main shop feed:                       [200/XXX]
Influencer feed (influencer-alex):    [200/XXX]
Products listing:                     [200/XXX]
Onboarding submit (POST):             [423/XXX]
Products create (POST):               [423/XXX]
Influencer shop add (POST):           [423/XXX]

## ISSUES
[List any endpoint that didn't match expected status]

## CONSOLE ERRORS
[Paste any browser errors from DevTools]
```

---

## If Tests Fail

**Read endpoints returning 500:**
- Check Supabase connection
- Check if `influencer-alex` shop exists
- Check server console logs

**Write endpoints not returning 423 when frozen:**
- Verify env vars are set
- Verify dev server was restarted
- Check `/api/debug/freezes` shows `true`
- Check middleware.ts logic

**Type errors:**
```powershell
pnpm typecheck
# Fix any errors shown
```

**Lint errors:**
```powershell
pnpm lint --fix
```

---

## Restore Unfrozen After Testing

```powershell
$env:CORE_FREEZE="false"
$env:NEXT_PUBLIC_CORE_FREEZE="false"
$env:SHOPS_FREEZE="false"
$env:NEXT_PUBLIC_SHOPS_FREEZE="false"

# In Supabase:
# UPDATE app.flags SET enabled = false WHERE name = 'shops_freeze';

# Restart dev server
```

---

## Ready to Run

1. Ensure test shop `influencer-alex` exists in database
2. Start dev server in one terminal: `pnpm dev`
3. Run commands above in another terminal
4. Report results using template
