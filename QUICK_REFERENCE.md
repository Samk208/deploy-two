# Quick Reference - Role Mapping & Onboarding Flow

## 🔄 Role Vocabulary Guide

### Onboarding (UI/Client)
- `"brand"` - User selects "Supplier" during sign-up
- `"influencer"` - User selects "Influencer" during sign-up

### Database (profiles.role)
- `"supplier"` - Brand/Supplier accounts
- `"influencer"` - Influencer accounts
- `"admin"` - Admin accounts
- `"customer"` - Regular customer accounts

### Dashboard Routes
- `/dashboard/supplier` - For supplier role
- `/dashboard/influencer` - For influencer role
- `/admin/dashboard` - For admin role

---

## 📐 Role Mapping Function Usage

```typescript
import { mapOnboardingRoleToDbRole } from "@/lib/role-mapper"

// In any onboarding API route:
const body = await request.json()
const { role } = body // "brand" or "influencer"

// Convert to DB role
const dbRole = mapOnboardingRoleToDbRole(role)
// dbRole is now "supplier" or "influencer"

// Update database
await supabaseAdmin
  .from("profiles")
  .update({ role: dbRole })
  .eq("id", user.id)
```

---

## 🚦 Onboarding Flow Diagram

```
┌─────────────┐
│  Sign Up    │
│ (Select Role)│
└──────┬──────┘
       │
       ├── Supplier Selected → POST /api/auth/sign-up { role: "supplier" }
       │                       ↓
       │                    profiles.role = "supplier"
       │                       ↓
       │                    Redirect to /auth/onboarding?role=brand
       │
       └── Influencer Selected → POST /api/auth/sign-up { role: "influencer" }
                                  ↓
                               profiles.role = "influencer"
                                  ↓
                               Redirect to /auth/onboarding?role=influencer

┌─────────────────────┐
│  Onboarding Page    │
│  (5 Steps)          │
└─────────┬───────────┘
          │
          ├── Step 1: Profile Basics
          │   POST /api/onboarding/step-1
          │   → Updates profiles.role immediately
          │
          ├── Step 2: Profile Details (Brand/Influencer specific)
          │   POST /api/onboarding/step-2
          │
          ├── Step 3: Verification (KYC/KYB)
          │   POST /api/onboarding/step-3
          │   POST /api/onboarding/docs (file uploads)
          │
          ├── Step 4: Commission Settings
          │   POST /api/onboarding/step-4
          │
          └── Step 5: Review & Submit
              POST /api/onboarding/submit
              ↓
              ├── Updates profiles.role (confirms)
              ├── Marks verification_requests as "submitted"
              ├── Marks onboarding_progress as "completed"
              └── Returns redirect path
                  ↓
                  ├── Influencer → /dashboard/influencer
                  └── Brand → /dashboard/supplier
```

---

## 🔐 Middleware Protection Flow

```
User visits: /dashboard/supplier

┌─────────────────────┐
│   Middleware.ts     │
└─────────┬───────────┘
          │
          ├── Check: Is route in publicRoutes?
          │   NO (removed in fix) ✅
          │
          ├── Check: Does user have session?
          │   ├── NO → Redirect to /sign-in?redirectTo=/dashboard/supplier
          │   └── YES → Continue
          │
          ├── Fetch user role from profiles table
          │
          ├── Check: Does userRole match dashboard role?
          │   ├── Supplier accessing /dashboard/supplier → Allow ✅
          │   ├── Influencer accessing /dashboard/supplier → Redirect to /dashboard/influencer
          │   ├── Admin accessing any dashboard → Allow ✅
          │   └── Customer accessing any dashboard → Redirect to /
          │
          └── Allow access
```

---

## 📝 Key API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Create account, set initial role
- `GET /api/auth/callback` - OAuth callback (for Google/GitHub)

### Onboarding
- `POST /api/onboarding/step-1` - Profile basics (UPDATES profiles.role)
- `POST /api/onboarding/step-2` - Profile details
- `POST /api/onboarding/step-3` - Verification info
- `POST /api/onboarding/step-4` - Commission settings
- `POST /api/onboarding/submit` - Final submit (CONFIRMS profiles.role)
- `POST /api/onboarding/docs` - Upload documents
- `GET /api/onboarding/progress` - Get saved progress

### User Data
- `GET /api/me` - Get current user info (includes role)

---

## 🧪 Testing Commands

```bash
# Run all E2E tests
npx playwright test

# Run specific test suite
npx playwright test tests/e2e/middleware/auth-middleware.spec.ts
npx playwright test tests/e2e/onboarding/submit-and-redirect.spec.ts

# Run with UI (helpful for debugging)
npx playwright test --ui

# Run unit tests
npm run test

# Run specific unit test
npm run test lib/__tests__/role-mapper.test.ts
```

---

## 🔍 Debugging Checklist

### Issue: User lands on wrong dashboard

**Check:**
1. What is `profiles.role` in database?
   ```sql
   SELECT id, name, role FROM profiles WHERE email = 'user@example.com';
   ```

2. What role is saved in onboarding_progress?
   ```sql
   SELECT user_id, role, status FROM onboarding_progress WHERE user_id = 'xxx';
   ```

3. Was step-1 API called successfully?
   - Check browser DevTools → Network → step-1 → Response
   - Should see `{ success: true, ... }`

4. Was submit API called successfully?
   - Check browser DevTools → Network → submit → Response
   - Should see `{ ok: true, role: "supplier"|"influencer", redirectPath: "/dashboard/..." }`

5. Does middleware redirect correctly?
   - Add `console.log` in middleware.ts at line 85
   - Check terminal logs for user role

### Issue: Unauthenticated user can access dashboard

**Check:**
1. Is middleware.ts being executed?
   - Add `console.log("Middleware running for:", pathname)` at top
   - Should see logs in terminal

2. Are dashboard routes still in publicRoutes?
   - Check middleware.ts lines 17-30
   - Should NOT contain `/dashboard/supplier`, `/dashboard/influencer`, `/admin/dashboard`

3. Is session cookie present?
   - Browser DevTools → Application → Cookies
   - Look for `sb-access-token` and `sb-refresh-token`

### Issue: Role is "brand" instead of "supplier"

**Check:**
1. Is role mapper being used?
   - Check step-1/route.ts imports
   - Should have `import { mapOnboardingRoleToDbRole } from "@/lib/role-mapper"`

2. Is database update successful?
   - Check step-1 API response
   - Add console.log after DB update
   ```typescript
   await supabaseAdmin.from("profiles").update({ role: dbRole }).eq("id", user.id)
   console.log("Updated role to:", dbRole)
   ```

---

## 🎯 Common Scenarios

### Scenario 1: New Influencer Sign-up
```
1. User clicks "Sign Up" → Selects "Influencer"
2. POST /api/auth/sign-up { role: "influencer", ... }
3. profiles.role = "influencer" ✅
4. Redirect to /auth/onboarding?role=influencer
5. Step 1: Updates profiles.role = "influencer" (confirms)
6. Steps 2-4: Save progress
7. Submit: Redirects to /dashboard/influencer ✅
```

### Scenario 2: New Brand/Supplier Sign-up
```
1. User clicks "Sign Up" → Selects "Supplier"
2. POST /api/auth/sign-up { role: "supplier", ... }
3. profiles.role = "supplier" ✅
4. Redirect to /auth/onboarding?role=brand
5. Step 1: Calls mapOnboardingRoleToDbRole("brand") → "supplier"
6. Updates profiles.role = "supplier" (confirms)
7. Steps 2-4: Save progress
8. Submit: Redirects to /dashboard/supplier ✅
```

### Scenario 3: OAuth Sign-up (Future Enhancement Needed)
```
1. User clicks "Sign in with Google"
2. OAuth callback creates profile with role = "customer"
3. Redirects to /auth/onboarding (NO role param) ⚠️
4. Onboarding defaults to "influencer"
5. User completes onboarding
6. Role may be wrong ❌

FIX NEEDED: Add role selection page for OAuth users
```

---

## 📚 Related Files

- `middleware.ts` - Auth & role routing
- `lib/role-mapper.ts` - Role conversion utility
- `lib/auth-helpers.ts` - User/auth helpers
- `app/api/auth/sign-up/route.ts` - Sign-up logic
- `app/api/onboarding/submit/route.ts` - Submit logic
- `app/auth/onboarding/page.tsx` - Onboarding UI

---

## ⚡ Quick Commands

```bash
# Check current middleware config
cat middleware.ts | grep -A 20 "publicRoutes"

# View role mapper utility
cat lib/role-mapper.ts

# Run all tests
npm run test && npx playwright test

# Check if role is persisted correctly (via API)
curl http://localhost:3000/api/me -H "Cookie: <your-session-cookie>"
```

---

## 🛠️ Manual Testing Scenarios

### Test 1: Influencer Complete Flow
1. Open browser in incognito mode
2. Go to `http://localhost:3000/sign-up`
3. Select "Influencer" role
4. Fill form and submit
5. **Verify**: Redirected to `/auth/onboarding?role=influencer`
6. Complete all 5 steps
7. Click "Submit" on final step
8. **Verify**: Redirected to `/dashboard/influencer`
9. **Verify**: Try accessing `/dashboard/supplier` → should redirect back to `/dashboard/influencer`

### Test 2: Supplier Complete Flow
1. Open browser in incognito mode
2. Go to `http://localhost:3000/sign-up`
3. Select "Supplier" role
4. Fill form and submit
5. **Verify**: Redirected to `/auth/onboarding?role=brand`
6. Complete all 5 steps
7. Click "Submit" on final step
8. **Verify**: Redirected to `/dashboard/supplier`
9. **Verify**: Try accessing `/dashboard/influencer` → should redirect back to `/dashboard/supplier`

### Test 3: Unauthenticated Access
1. Open browser in incognito mode
2. Go to `http://localhost:3000/dashboard/supplier`
3. **Verify**: Immediately redirected to `/sign-in?redirectTo=%2Fdashboard%2Fsupplier`
4. Go to `http://localhost:3000/dashboard/influencer`
5. **Verify**: Immediately redirected to `/sign-in?redirectTo=%2Fdashboard%2Finfluencer`

---

## 🔧 Troubleshooting Guide

### Problem: Tests fail with "Cannot find module '@/lib/role-mapper'"

**Solution:**
```bash
# Ensure the file exists
ls -la lib/role-mapper.ts

# If missing, the file should contain:
cat lib/role-mapper.ts
# Should show role mapping functions

# Restart TypeScript server in your editor
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Problem: Middleware not redirecting

**Solution:**
```bash
# 1. Check if middleware is running
# Add to middleware.ts at line 8:
console.log("🔐 Middleware executing for:", req.nextUrl.pathname)

# 2. Restart dev server
npm run dev

# 3. Visit /dashboard/supplier in browser
# 4. Check terminal - should see log output
```

### Problem: Role is "brand" in database instead of "supplier"

**Solution:**
```typescript
// Check step-1/route.ts has this code:
import { mapOnboardingRoleToDbRole } from "@/lib/role-mapper"

// Around line 45:
const dbRole = mapOnboardingRoleToDbRole(body.role)
await supabaseAdmin.from("profiles").update({ role: dbRole }).eq("id", user.id)

// If missing, the import was not added correctly
```

---

## 📊 Expected Database State After Onboarding

### After Influencer Onboarding:
```sql
-- profiles table
SELECT id, name, role FROM profiles WHERE id = 'user-id';
-- Expected: role = 'influencer'

-- onboarding_progress table
SELECT user_id, role, status FROM onboarding_progress WHERE user_id = 'user-id';
-- Expected: role = 'influencer', status = 'completed'

-- verification_requests table
SELECT user_id, role, status FROM verification_requests WHERE user_id = 'user-id';
-- Expected: role = 'influencer', status = 'submitted'
```

### After Brand/Supplier Onboarding:
```sql
-- profiles table
SELECT id, name, role FROM profiles WHERE id = 'user-id';
-- Expected: role = 'supplier' (NOT 'brand')

-- onboarding_progress table
SELECT user_id, role, status FROM onboarding_progress WHERE user_id = 'user-id';
-- Expected: role = 'supplier', status = 'completed'

-- verification_requests table
SELECT user_id, role, status FROM verification_requests WHERE user_id = 'user-id';
-- Expected: role = 'supplier', status = 'submitted'
```

---

## 🚨 Critical Reminders

1. **Never use "brand" in database** - Always use "supplier"
2. **Dashboard routes are now protected** - No public access
3. **Step 1 updates role immediately** - Don't wait for submit
4. **Always use mapOnboardingRoleToDbRole()** - Don't manually convert
5. **Test with incognito mode** - Ensures clean session state

---

## ✅ Verification Checklist

Before deploying:
- [ ] Run `npx playwright test` - All tests pass
- [ ] Run `npm run test` - Unit tests pass
- [ ] Test influencer sign-up → correct dashboard
- [ ] Test supplier sign-up → correct dashboard
- [ ] Test unauthenticated access → redirects to sign-in
- [ ] Check database - roles are "supplier" not "brand"
- [ ] Check middleware.ts - dashboard routes NOT in publicRoutes
- [ ] Check all step APIs - import role-mapper

---

## 📞 Support

If issues persist:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed changes
2. Review the audit report in your documents
3. Verify all files were updated correctly
4. Check Supabase logs for database errors
5. Use browser DevTools Network tab to trace API calls

---

**Last Updated**: Implementation completed
**Status**: ✅ All critical fixes implemented and tested
