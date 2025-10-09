# Local Verification Steps

## Prerequisites

1. **Database Setup**
   ```sql
   -- Ensure test data exists for handle: influencer-alex
   -- Check if shop exists:
   SELECT s.id, s.handle, s.name, s.active, s.influencer_id 
   FROM shops s 
   WHERE s.handle = 'influencer-alex';
   
   -- Check if influencer has curated products:
   SELECT isp.id, isp.product_id, isp.display_order, isp.sale_price, isp.custom_title
   FROM influencer_shop_products isp
   JOIN shops s ON s.influencer_id = isp.influencer_id
   WHERE s.handle = 'influencer-alex' AND isp.published = true
   LIMIT 5;
   ```

2. **Package Scripts**
   Ensure these exist in `package.json`:
   ```json
   {
     "scripts": {
       "test:shops-freeze": "node scripts/test-shops-freeze.mjs"
     }
   }
   ```

---

## Test Sequence

### Phase 1: Unfrozen State (Writes Should Pass)

#### Step 1.1: Set Environment Variables
```powershell
# PowerShell
$env:CORE_FREEZE="false"
$env:NEXT_PUBLIC_CORE_FREEZE="false"
$env:SHOPS_FREEZE="false"
$env:NEXT_PUBLIC_SHOPS_FREEZE="false"
$env:BASE_URL="http://localhost:3000"
```

#### Step 1.2: Update Database Flag
```sql
-- In Supabase SQL Editor
UPDATE app.flags 
SET enabled = false 
WHERE name = 'shops_freeze';

-- Verify
SELECT name, enabled FROM app.flags WHERE name = 'shops_freeze';
```

#### Step 1.3: Start Dev Server (New Terminal)
```powershell
pnpm dev
```

Wait for: `✓ Ready in [time]`

#### Step 1.4: Verify Freeze State
Open browser: `http://localhost:3000/api/debug/freezes`

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "envCore": false,
    "envShops": false,
    "dbShops": false,
    "effective": {
      "coreFreeze": false,
      "shopsFreeze": false
    }
  }
}
```

#### Step 1.5: Run Tests (Original Terminal)
```powershell
# Test 1: Node.js freeze test
pnpm test:shops-freeze

# Test 2: PowerShell smoke test
.\scripts\integration-smoke.ps1
```

#### Step 1.6: Expected Results - Unfrozen

| Endpoint | Method | Expected | Notes |
|----------|--------|----------|-------|
| /api/main-shop/feed | GET | 200 | Products loaded |
| /api/influencer/influencer-alex/feed | GET | 200 | Curated feed |
| /api/products | GET | 200 | All products |
| /api/onboarding/submit | POST | 401/403/422 | Auth required (NOT 423) |
| /api/products | POST | 401/403/422 | Auth required (NOT 423) |
| /api/influencer/shop | POST | 401/403/422 | Auth required (NOT 423) |

**Key Point**: POSTs should return auth errors (401/403/422), NOT 423 freeze errors.

---

### Phase 2: Frozen State (Writes Must Be Blocked)

#### Step 2.1: Set Environment Variables
```powershell
# PowerShell (same terminal)
$env:CORE_FREEZE="true"
$env:NEXT_PUBLIC_CORE_FREEZE="true"
$env:SHOPS_FREEZE="true"
$env:NEXT_PUBLIC_SHOPS_FREEZE="true"
```

#### Step 2.2: Update Database Flag
```sql
-- In Supabase SQL Editor
UPDATE app.flags 
SET enabled = true 
WHERE name = 'shops_freeze';

-- Verify
SELECT name, enabled FROM app.flags WHERE name = 'shops_freeze';
```

#### Step 2.3: Restart Dev Server
```powershell
# In dev server terminal: Ctrl+C to stop
pnpm dev
```

Wait for: `✓ Ready in [time]`

#### Step 2.4: Verify Freeze State
Open browser: `http://localhost:3000/api/debug/freezes`

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "envCore": true,
    "envShops": true,
    "dbShops": true,
    "effective": {
      "coreFreeze": true,
      "shopsFreeze": true
    }
  }
}
```

#### Step 2.5: Run Tests (Original Terminal)
```powershell
# Test 1: Node.js freeze test
pnpm test:shops-freeze

# Test 2: PowerShell smoke test
.\scripts\integration-smoke.ps1
```

#### Step 2.6: Expected Results - Frozen

| Endpoint | Method | Expected | Notes |
|----------|--------|----------|-------|
| /api/main-shop/feed | GET | 200 | Reads still work |
| /api/influencer/influencer-alex/feed | GET | 200 | Reads still work |
| /api/products | GET | 200 | Reads still work |
| /api/onboarding/submit | POST | 423 | Blocked by CORE_FREEZE |
| /api/products | POST | 423 | Blocked by SHOPS_FREEZE |
| /api/influencer/shop | POST | 423 | Blocked by SHOPS_FREEZE |

**Key Point**: POSTs should return 423 (Locked) due to freeze.

---

## Additional Manual Checks

### Visual Verification

1. **Main Shop Page**
   ```
   http://localhost:3000/shop
   ```
   - ✅ Products load
   - ✅ Freeze banner appears (when frozen)
   - ✅ Filters work
   - ✅ Pagination works

2. **Influencer Shop Page**
   ```
   http://localhost:3000/shop/influencer-alex
   ```
   - ✅ Shop loads
   - ✅ Curated products display
   - ✅ Sale prices show (if configured)
   - ✅ Freeze banner appears (when frozen)

3. **Shop Directory**
   ```
   http://localhost:3000/shops
   ```
   - ✅ Shop list loads
   - ✅ Cards render correctly

### Browser Console Check
Open DevTools → Console

**Expected**: No errors
**Watch for**:
- ❌ Failed to fetch
- ❌ 500 Internal Server Error
- ❌ Hydration errors

---

## Output Summary Template

After running both phases, fill this table:

```markdown
## Verification Results

### Unfrozen State (flags=false)

| Endpoint | Method | Expected | Actual | Status |
|----------|--------|----------|--------|--------|
| /api/main-shop/feed | GET | 200 | [YOUR_RESULT] | ✅/❌ |
| /api/influencer/influencer-alex/feed | GET | 200 | [YOUR_RESULT] | ✅/❌ |
| /api/products | GET | 200 | [YOUR_RESULT] | ✅/❌ |
| /api/onboarding/submit | POST | 401/403/422 | [YOUR_RESULT] | ✅/❌ |
| /api/products | POST | 401/403/422 | [YOUR_RESULT] | ✅/❌ |
| /api/influencer/shop | POST | 401/403/422 | [YOUR_RESULT] | ✅/❌ |

### Frozen State (flags=true)

| Endpoint | Method | Expected | Actual | Status |
|----------|--------|----------|--------|--------|
| /api/main-shop/feed | GET | 200 | [YOUR_RESULT] | ✅/❌ |
| /api/influencer/influencer-alex/feed | GET | 200 | [YOUR_RESULT] | ✅/❌ |
| /api/products | GET | 200 | [YOUR_RESULT] | ✅/❌ |
| /api/onboarding/submit | POST | 423 | [YOUR_RESULT] | ✅/❌ |
| /api/products | POST | 423 | [YOUR_RESULT] | ✅/❌ |
| /api/influencer/shop | POST | 423 | [YOUR_RESULT] | ✅/❌ |

### Issues Found

[List any endpoints that didn't match expectations]

### Console Errors

[Paste any browser console errors]
```

---

## Troubleshooting

### Issue: "demo-influencer" handle not found

**Fix**: Update smoke test to use `influencer-alex`:
```powershell
# Edit scripts/integration-smoke.ps1
# Change: Path = "/api/influencer/demo-influencer/feed"
# To:     Path = "/api/influencer/influencer-alex/feed"
```

### Issue: 500 errors on feed endpoints

**Check**:
1. Database connection (Supabase credentials)
2. RLS policies allow public reads
3. Server logs for stack traces

### Issue: Freeze not taking effect

**Check**:
1. Environment variables set correctly
2. Dev server restarted after changing flags
3. Database flag updated
4. `/api/debug/freezes` shows correct state

### Issue: Lint/TypeCheck failures

**Run**:
```powershell
pnpm lint --fix
pnpm typecheck
```

**Common fixes**:
- Missing imports
- Type mismatches
- Unused variables

---

## Pre-Verification Checklist

Before starting tests:

- [ ] Database has test shop: `influencer-alex`
- [ ] Shop has published products in `influencer_shop_products`
- [ ] `app.flags` table exists with `shops_freeze` row
- [ ] Package scripts include `test:shops-freeze`
- [ ] `.env.local` has Supabase credentials
- [ ] No other dev server running on port 3000

---

## Post-Verification Steps

After successful verification:

1. **Restore Unfrozen State**
   ```powershell
   $env:CORE_FREEZE="false"
   $env:NEXT_PUBLIC_CORE_FREEZE="false"
   $env:SHOPS_FREEZE="false"
   $env:NEXT_PUBLIC_SHOPS_FREEZE="false"
   ```

   ```sql
   UPDATE app.flags SET enabled = false WHERE name = 'shops_freeze';
   ```

2. **Run Full Lint/Type Check**
   ```powershell
   pnpm lint
   pnpm typecheck
   ```

3. **Commit Changes** (if all passing)
   ```powershell
   git add .
   git commit -m "Complete shop feed integration with freeze system"
   git push origin main
   ```

---

## Ready to Start?

Run the commands above and report back with:
1. The filled summary table
2. Any error messages
3. Screenshots of browser pages (if issues found)

I'll analyze the results and provide fixes for any failing endpoints.
