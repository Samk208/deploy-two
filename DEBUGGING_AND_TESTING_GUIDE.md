# DEBUGGING & TESTING GUIDE
## VO-ONELINK-GOOGLE PROJECT - SELF-SERVICE TROUBLESHOOTING

---

## 🚀 **QUICK START COMMANDS**

### **Basic Development**
```bash
# Start development server
pnpm dev

# Build the project
pnpm build

# Check for TypeScript errors
pnpm typecheck

# Run linting
pnpm lint
```

---

## 🔍 **DEBUGGING COMMANDS**

### **1. Environment Variable Debugging**
```bash
# Check if .env.local exists and has content
ls -la .env.local
cat .env.local

# Check if environment variables are loaded
node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')"
node -e "console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')"

# Check Next.js environment loading
pnpm dev --debug
```

### **2. Supabase Connection Testing**
```bash
# Test Supabase connection from command line
node -e "
const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('URL:', url)
console.log('Key exists:', !!key)
if (url && key) {
  const supabase = createClient(url, key)
  console.log('Supabase client created successfully')
} else {
  console.log('Missing environment variables')
}
"
```

### **3. Database Connection Testing**
```bash
# Test database connection (if you have Supabase CLI)
supabase status

# Check if your database is accessible
curl -X GET "https://fgnkymynpslqpnwfsxth.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🧪 **PLAYWRIGHT TESTING COMMANDS**

### **1. Basic Test Execution**
```bash
# Run all tests
pnpm e2e

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests with UI (interactive)
npx playwright test --ui
```

### **2. Debug Mode Testing**
```bash
# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode (step by step)
npx playwright test --debug

# Run specific test with debug
npx playwright test tests/auth.spec.ts --debug

# Run tests with slow motion
npx playwright test --headed --timeout=60000
```

### **3. Test Isolation & Debugging**
```bash
# Run only one test
npx playwright test tests/auth.spec.ts -g "should allow a user to sign up"

# Run tests with specific grep pattern
npx playwright test -g "sign up"

# Run tests and show console logs
npx playwright test --headed --debug --timeout=60000

# Generate test report
npx playwright show-report
```

---

## 🐛 **SPECIFIC ISSUE DEBUGGING**

### **1. Shop Page Crash Debugging**
```bash
# Check browser console errors
# 1. Open browser dev tools (F12)
# 2. Go to Console tab
# 3. Navigate to /shop
# 4. Look for "supabaseKey is required" error

# Check network requests
# 1. Go to Network tab in dev tools
# 2. Navigate to /shop
# 3. Look for failed requests
# 4. Check response status codes

# Test environment variables in browser
# In browser console, run:
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### **2. Authentication Flow Debugging**
```bash
# Test sign-up flow manually
# 1. Go to /sign-up
# 2. Fill out form with test data
# 3. Submit and watch network tab
# 4. Check for API errors

# Test API endpoints directly
curl -X POST "http://localhost:3000/api/auth/sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123",
    "role": "customer"
  }'
```

### **3. Build System Debugging**
```bash
# Clean build cache
rm -rf .next
rm -rf .turbo
pnpm build

# Check for specific build errors
pnpm build 2>&1 | grep -i "error\|fail"

# Verify TypeScript compilation
pnpm typecheck 2>&1 | head -20

# Check for import issues
grep -r "from '@/lib/supabase'" app/ --include="*.ts" --include="*.tsx"
```

---

## 🔧 **SELF-FIX COMMANDS**

### **1. Fix Environment Variables**
```bash
# Create .env.local if missing
cp env.example .env.local

# Edit .env.local with your values
# Use your preferred editor (nano, vim, code, etc.)
nano .env.local

# Verify .gitignore includes .env.local
grep -n ".env.local" .gitignore
```

### **2. Fix Supabase Key Issues**
```bash
# Check current Supabase configuration
cat lib/supabase.ts

# Verify environment variable usage
grep -n "process.env" lib/supabase.ts

# Test Supabase client creation
node -e "
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  console.log('✅ Supabase client created successfully')
} catch (error) {
  console.log('❌ Error:', error.message)
}
"
```

### **3. Fix Test Issues**
```bash
# Check test configuration
cat playwright.config.ts

# Verify test data setup
cat tests/auth.spec.ts | head -30

# Run single test to see specific error
npx playwright test tests/auth.spec.ts -g "should allow a user to sign up" --headed --debug
```

---

## 📊 **MONITORING & LOGS**

### **1. Development Server Logs**
```bash
# Start dev server with verbose logging
pnpm dev --debug

# Watch for specific errors
pnpm dev 2>&1 | grep -i "error\|fail\|crash"

# Check Next.js logs
tail -f .next/server.log 2>/dev/null || echo "No server log found"
```

### **2. Browser Console Monitoring**
```bash
# In browser console, add error monitoring:
window.addEventListener('error', (e) => {
  console.log('🚨 Global Error:', e.error)
})

window.addEventListener('unhandledrejection', (e) => {
  console.log('🚨 Unhandled Promise Rejection:', e.reason)
})
```

### **3. Network Request Monitoring**
```bash
# In browser console, monitor API calls:
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('🌐 API Call:', args[0], args[1])
  return originalFetch.apply(this, args)
}
```

---

## 🎯 **STEP-BY-STEP DEBUGGING WORKFLOW**

### **When Shop Page Crashes:**
1. **Check browser console** for error messages
2. **Check network tab** for failed requests
3. **Verify environment variables** are loaded
4. **Test Supabase connection** manually
5. **Check API endpoint** responses

### **When Tests Fail:**
1. **Run single test** with `--debug` flag
2. **Check test data** requirements
3. **Verify page elements** exist
4. **Check authentication** state
5. **Monitor network requests** during test

### **When Build Fails:**
1. **Clean cache** and rebuild
2. **Check TypeScript errors** with `pnpm typecheck`
3. **Verify import paths** are correct
4. **Check for syntax errors** in modified files
5. **Verify dependencies** are installed

---

## 🚨 **COMMON ERROR PATTERNS & SOLUTIONS**

### **"supabaseKey is required"**
```bash
# Solution: Check environment variables
echo "SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Fix: Update .env.local
nano .env.local
```

### **"Multiple GoTrueClient instances"**
```bash
# Solution: Check for duplicate Supabase client creation
grep -r "createClient" lib/ --include="*.ts" --include="*.tsx"

# Fix: Ensure single client instance per context
```

### **"params is not iterable"**
```bash
# Solution: Update to Next.js 15 async params
# Change: params: { id: string }
# To: params: Promise<{ id: string }>
# Add: const { id } = await params
```

---

## 📚 **LEARNING RESOURCES**

### **Playwright Documentation**
- [Playwright Getting Started](https://playwright.dev/docs/intro)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Test Generator](https://playwright.dev/docs/codegen)

### **Next.js 15 Migration**
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/upgrading)
- [App Router Changes](https://nextjs.org/docs/app/building-your-application/routing)

### **Supabase Integration**
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Environment Variables](https://supabase.com/docs/guides/getting-started/environment-variables)

---

## 🎉 **SUCCESS CHECKLIST**

After debugging, verify:
- [ ] **Shop page loads** without crashes
- [ ] **Authentication flows** work end-to-end
- [ ] **API endpoints** return proper responses
- [ ] **Build system** completes successfully
- [ ] **Tests pass** (or fail for expected reasons)
- [ ] **Environment variables** are properly loaded
- [ ] **No console errors** in browser
- [ ] **Network requests** complete successfully

---

**Remember**: Start with simple commands, work your way up to complex debugging, and always check the browser console first! 🚀
