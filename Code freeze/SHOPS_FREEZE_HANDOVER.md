# SHOPS_FREEZE System - Implementation Handover

## 📋 Overview

The SHOPS_FREEZE system provides granular write-protection for shop and product operations during maintenance or integration periods. Unlike the existing Core Freeze (which protects onboarding/dashboards), this system specifically guards shop-related endpoints while allowing reads to continue normally.

## 🎯 Key Features

- **Opt-in activation** via environment variables
- **HTTP 423 response** for blocked write operations
- **Read operations unaffected** - customers can still browse
- **UI soft-lock** with visual indicators
- **Fully reversible** without code changes
- **Separate from Core Freeze** - can run independently

## 🔧 Implementation Details

### Environment Variables

```bash
# Server-side freeze control
SHOPS_FREEZE=true|false

# Client-side UI freeze control
NEXT_PUBLIC_SHOPS_FREEZE=true|false
```

### Protected Endpoints

Write operations (POST/PUT/DELETE) to these patterns return HTTP 423:

- `/api/products` - Product management
- `/api/shop` - Shop operations
- `/api/influencer-shop` - Influencer shop curation
- `/api/influencer/shop` - Alternative curation endpoint

### File Changes Summary

```
📁 Project Root
├── .env.example                           [MODIFIED] +4 lines
├── middleware.ts                          [MODIFIED] +28 lines
├── package.json                           [MODIFIED] +3 lines
├── lib/isShopFrozen.ts                   [NEW] 7 lines
├── components/ShopFreezeBanner.tsx       [NEW] 22 lines
└── scripts/test-shops-freeze.mjs         [NEW] 224 lines
```

## 🚀 Activation & Control

### Quick Start

```bash
# Enable shop freeze (development)
pnpm shops:freeze:on

# Enable shop freeze (production)
pnpm shops:freeze:build

# Disable (normal operation)
pnpm dev  # or set SHOPS_FREEZE=false
```

### Manual Control

Set environment variables directly:

```bash
export SHOPS_FREEZE=true
export NEXT_PUBLIC_SHOPS_FREEZE=true
```

## 🧪 Testing & Verification

### Automated Testing

```bash
# Run comprehensive test suite
pnpm test:shops-freeze
```

The test script verifies:

- ✅ Read endpoints work during freeze
- ✅ Write endpoints blocked (423) during freeze
- ✅ Write endpoints work when freeze disabled
- ✅ Proper error messages returned

### Manual Testing

1. **Enable freeze**: `pnpm shops:freeze:on`
2. **Test blocked writes**:
   ```bash
   curl -X POST http://localhost:3000/api/products \
        -H "Content-Type: application/json" \
        -d '{"title":"test"}'
   # Expected: {"ok":false,"error":"SHOPS_FREEZE active"}
   ```
3. **Test allowed reads**:
   ```bash
   curl http://localhost:3000/api/products
   # Expected: Normal product listing
   ```

## 💻 UI Integration

### Banner Component

Add to layouts where shop editing occurs:

```tsx
import ShopFreezeBanner from "@/components/ShopFreezeBanner";

function Layout() {
  return (
    <div>
      <ShopFreezeBanner />
      {/* ... rest of layout */}
    </div>
  );
}
```

### Disable Interactions

```tsx
import { isShopFrozen } from "@/lib/isShopFrozen";

function ProductEditForm() {
  const frozen = isShopFrozen();

  return (
    <div className={frozen ? "pointer-events-none select-none opacity-50" : ""}>
      <button disabled={frozen}>Save Product</button>
      {/* ... form fields */}
    </div>
  );
}
```

## 🛡️ Security & Safety

### Middleware Protection

- **Server-side enforcement** prevents bypass attempts
- **Regex pattern matching** ensures comprehensive coverage
- **Safe methods allowed** (GET, HEAD, OPTIONS)
- **Proper HTTP status codes** (423 Locked)

### Error Handling

- **Consistent error format**: `{"ok":false,"error":"SHOPS_FREEZE active"}`
- **Clear status codes**: HTTP 423 (Locked)
- **Client-friendly messages** for UI display

## 🔄 Operational Workflows

### Maintenance Window Activation

1. **Pre-activation checklist**:
   - [ ] Notify stakeholders
   - [ ] Verify backup completion
   - [ ] Test freeze functionality in staging
2. **Activation**:

   ```bash
   # Set environment variables
   export SHOPS_FREEZE=true
   export NEXT_PUBLIC_SHOPS_FREEZE=true

   # Restart application
   pm2 restart app  # or your process manager
   ```

3. **Verification**:
   ```bash
   # Quick health check
   pnpm test:shops-freeze
   ```

### Post-Maintenance Deactivation

1. **Deactivation**:

   ```bash
   # Unset or set to false
   export SHOPS_FREEZE=false
   export NEXT_PUBLIC_SHOPS_FREEZE=false

   # Restart application
   pm2 restart app
   ```

2. **Verification**:
   - Test shop/product write operations
   - Verify UI banners disappeared
   - Check application logs for errors

## 📊 Monitoring & Logs

### Log Patterns to Monitor

```bash
# Successful freeze blocks (expected)
grep "SHOPS_FREEZE active" logs/

# Application errors during freeze
grep "ERROR.*shop\|product" logs/

# Freeze activation/deactivation
grep "SHOPS_FREEZE" logs/
```

### Health Checks

- **Read operations** should continue working
- **Write operations** should return 423
- **UI elements** should show freeze indicators
- **No application crashes** due to freeze logic

## 🚨 Troubleshooting

### Common Issues

#### "Freeze not working - writes still allowed"

**Solution**: Check environment variables are set correctly

```bash
echo $SHOPS_FREEZE           # Should be "true"
echo $NEXT_PUBLIC_SHOPS_FREEZE  # Should be "true"
```

#### "UI banner not showing"

**Solution**: Verify client-side environment variable

```bash
# In browser console
console.log(process.env.NEXT_PUBLIC_SHOPS_FREEZE)
```

#### "Some endpoints still writable"

**Solution**: Check middleware regex patterns cover the endpoint

- Review `middleware.ts` SHOP_WRITE_PATTERNS array
- Test specific endpoint with curl

#### "Application errors during freeze"

**Solution**: Check for code that doesn't handle 423 responses

```bash
# Look for unhandled fetch errors
grep -r "fetch.*api/\(products\|shop\)" components/
```

## 📋 Rollback Procedures

### Emergency Rollback

If freeze causes unexpected issues:

1. **Immediate**: Disable environment variables

   ```bash
   unset SHOPS_FREEZE
   unset NEXT_PUBLIC_SHOPS_FREEZE
   pm2 restart app
   ```

2. **If environment changes don't work**:
   - Comment out freeze logic in `middleware.ts`
   - Redeploy application

3. **Code rollback** (if needed):
   ```bash
   git revert <commit-hash>  # Revert freeze implementation
   ```

### Planned Rollback

For scheduled maintenance completion:

1. Complete maintenance tasks
2. Update environment variables to false
3. Restart application
4. Verify normal operation resumed

## 🔗 Related Systems

### Core Freeze Integration

- **Independent operation** - both can run simultaneously
- **Different scope** - Core protects onboarding/dashboards
- **Separate controls** - Different environment variables
- **Compatible middleware** - Both checks in same function

### Database Integration

- **No DB changes required** - purely application-level
- **Works with existing** shop/product tables
- **Safe for migrations** - read operations continue

## 📚 Developer Reference

### Key Files Modified

```typescript
// middleware.ts - Main freeze logic
if (process.env.SHOPS_FREEZE === "true") {
  // Block write operations to shop endpoints
}

// lib/isShopFrozen.ts - Client-side helper
export const isShopFrozen = (): boolean => {
  return process.env.NEXT_PUBLIC_SHOPS_FREEZE === "true";
};

// components/ShopFreezeBanner.tsx - UI indicator
export default function ShopFreezeBanner() {
  if (!isShopFrozen()) return null;
  return <div>Shop maintenance mode...</div>;
}
```

### Testing Endpoints

```bash
# Write endpoints (should return 423 when frozen)
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/influencer/shop
PUT    /api/influencer/shop/:id
DELETE /api/influencer/shop/:id

# Read endpoints (should always work)
GET    /api/products
GET    /api/shop/:handle
GET    /api/main-shop/feed
```

## 📞 Support & Contacts

### Implementation Team

- **Developer**: AI Assistant (Qoder)
- **Implementation Date**: 2025-01-08
- **Version**: 1.0.0

### Documentation

- **Source Code**: `/middleware.ts`, `/lib/isShopFrozen.ts`
- **Tests**: `/scripts/test-shops-freeze.mjs`
- **Configuration**: `.env.example`

### Emergency Contacts

- Check application logs first
- Test with `pnpm test:shops-freeze`
- Review middleware configuration
- Escalate to development team if needed

---

## ✅ Handover Checklist

- [ ] Environment variables documented and configured
- [ ] Middleware logic implemented and tested
- [ ] UI components created and integrated
- [ ] Test scripts created and validated
- [ ] Package.json scripts added
- [ ] Documentation completed
- [ ] Emergency procedures defined
- [ ] Rollback procedures tested

**Status**: ✅ COMPLETE - Ready for production use

**Last Updated**: 2025-01-08
**Version**: 1.0.0
