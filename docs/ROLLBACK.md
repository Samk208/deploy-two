# Rolling Back Patches

This document describes how to rollback patches if issues arise.

## Rolling Back the Improve Onboarding and Docs Patch

If you need to rollback the `improve-onboarding-and-docs.patch`, follow these steps:

### What This Patch Changed

The patch modified these files:
- `app/auth/onboarding/components/InfluencerKYCStep.tsx` - File size limit from 10MB to 5MB
- `app/auth/onboarding/components/BrandKYBStep.tsx` - File size limit from 10MB to 5MB  
- `app/auth/onboarding/page.tsx` - Added URL state management
- `tests/onboarding-flow.spec.ts` - New test file
- `docs/APPLY.md` - New documentation

### Step 1: Revert the Patch

```bash
# Revert the patch
git apply --reverse patches/improve-onboarding-and-docs.patch

# Check the status
git status
```

### Step 2: Verify Rollback

```bash
# Check that file size limits are back to 10MB
grep -r "10MB" app/auth/onboarding/components/

# Verify URL state management is removed
grep -r "usePathname" app/auth/onboarding/page.tsx || echo "usePathname removed successfully"

# Check that tests are removed
ls tests/onboarding-flow.spec.ts || echo "Test file removed successfully"
```

### Step 3: Clean Up (if needed)

If the patch revert doesn't work cleanly:

```bash
# Reset to the previous commit
git reset --hard HEAD~1

# Or restore specific files
git checkout HEAD -- app/auth/onboarding/components/InfluencerKYCStep.tsx
git checkout HEAD -- app/auth/onboarding/components/BrandKYBStep.tsx
git checkout HEAD -- app/auth/onboarding/page.tsx

# Remove the test file
rm -f tests/onboarding-flow.spec.ts
```

### Step 4: Test the Rollback

1. Navigate to `/auth/onboarding?role=influencer`
2. Verify file uploads accept files up to 10MB again
3. Check that the onboarding flow works without URL state management
4. Ensure no console errors related to URL state

### What Gets Restored

After rollback:
- ✅ File size limits return to 10MB
- ✅ URL state management is removed
- ✅ Onboarding flow returns to localStorage-only state
- ✅ New tests are removed
- ✅ Original functionality is preserved

### Alternative Rollback Method

If you prefer to manually restore:

```bash
# Manually restore file size limits
sed -i 's/5MB/10MB/g' app/auth/onboarding/components/InfluencerKYCStep.tsx
sed -i 's/5MB/10MB/g' app/auth/onboarding/components/BrandKYBStep.tsx

# Manually restore file size validation
sed -i 's/5 \* 1024 \* 1024/10 * 1024 * 1024/g' app/auth/onboarding/components/InfluencerKYCStep.tsx
sed -i 's/5 \* 1024 \* 1024/10 * 1024 * 1024/g' app/auth/onboarding/components/BrandKYBStep.tsx
```

### Troubleshooting Rollback

**Issue**: Patch revert fails with conflicts
**Solution**: Use manual restoration or git reset

**Issue**: File size limits still show 5MB
**Solution**: Check for multiple occurrences and update all

**Issue**: URL state still persists
**Solution**: Remove usePathname import and related URL logic

**Issue**: Tests still exist
**Solution**: Manually delete the test file

### Next Steps After Rollback

1. Test the onboarding flow thoroughly
2. Verify file uploads work with 10MB limit
3. Check that localStorage state management works
4. Run existing tests to ensure no regressions
5. Document any issues encountered during rollback
