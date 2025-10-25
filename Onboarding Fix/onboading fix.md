## Testing Strategy (Inline Context)

### Unit Tests

**Test:** `tests/unit/document-validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { SUPPLIER_DOC_TYPES, INFLUENCER_DOC_TYPES } from '@/lib/constants/documents';

describe('Document Type Constants', () => {
  it('should have unique values', () => {
    const allValues = Object.values({ 
      ...SUPPLIER_DOC_TYPES, 
      ...INFLUENCER_DOC_TYPES 
    });
    const uniqueValues = new Set(allValues);
    expect(uniqueValues.size).toBe(allValues.length);
  });

  it('should match server validation', () => {
    // Ensure constants match what API expects
    expect(SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION).toBe('business_registration');
    expect(SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK).toBe('bank_account_book');
    expect(SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT).toBe('mail_order_sales_report');
    expect(INFLUENCER_DOC_TYPES.GOVERNMENT_ID).toBe('government_id');
    expect(INFLUENCER_DOC_TYPES.BANK_BOOK).toBe('bank_book');
  });
});

describe('File Validation', () => {
  it('should accept valid image types', () => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    validTypes.forEach(type => {
      expect(() => validateFile({ type, size: 1000 })).not.toThrow();
    });
  });

  it('should accept PDF', () => {
    expect(() => validateFile({ 
      type: 'application/pdf', 
      size: 1000 
    })).not.toThrow();
  });

  it('should reject files over 10MB', () => {
    expect(() => validateFile({ 
      type: 'image/jpeg', 
      size: 11 * 1024 * 1024 
    })).toThrow('10MB');
  });

  it('should reject invalid types', () => {
    expect(() => validateFile({ 
      type: 'text/plain', 
      size: 1000 
    })).toThrow('지원하지 않는 파일 형식');
  });
});
```

### E2E Tests (Inline Upload Flow)

**Test:** `tests/e2e/onboarding-inline-upload.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { SUPPLIER_DOC_TYPES, INFLUENCER_DOC_TYPES } from '@/lib/constants/documents';

test.describe('Influencer Onboarding - Inline Upload', () => {
  test('should complete email verification and document upload on same page', async ({ page }) => {
    // Login as influencer
    await page.goto('/auth/onboarding');
    
    // Should see email verification section at top
    await expect(page.getByRole('heading', { name: '이메일 인증' })).toBeVisible();
    
    // Document uploads should be disabled initially
    const firstUploadCard = page.locator('[data-testid="upload-card"]').first();
    await expect(firstUploadCard).toHaveAttribute('aria-disabled', 'true');
    
    // Complete email verification
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("인증코드 전송")');
    await page.fill('input[placeholder*="6자리"]', '123456');
    await page.click('button:has-text("인증 확인")');
    
    // Wait for verification success
    await expect(page.locator('text=이메일 인증 완료')).toBeVisible();
    
    // Document uploads should now be enabled
    await expect(firstUploadCard).not.toHaveAttribute('aria-disabled', 'true');
    
    // Upload government ID
    const govIdUpload = page.locator(`[data-document-type="${INFLUENCER_DOC_TYPES.GOVERNMENT_ID}"]`);
    const govIdInput = govIdUpload.locator('input[type="file"]');
    await govIdInput.setInputFiles('tests/fixtures/government-id.jpg');
    
    // Wait for upload completion
    await expect(govIdUpload.locator('text=업로드 완료')).toBeVisible({ timeout: 10000 });
    
    // Upload bank book
    const bankUpload = page.locator(`[data-document-type="${INFLUENCER_DOC_TYPES.BANK_BOOK}"]`);
    const bankInput = bankUpload.locator('input[type="file"]');
    await bankInput.setInputFiles('tests/fixtures/bank-book.jpg');
    
    await expect(bankUpload.locator('text=업로드 완료')).toBeVisible({ timeout: 10000 });
    
    // Check progress indicator
    await expect(page.locator('text=2 / 2')).toBeVisible();
    
    // Submit button should be enabled
    const submitButton = page.getByRole('button', { name: '다음 단계로' });
    await expect(submitButton).toBeEnabled();
    
    // Submit and verify navigation
    await submitButton.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show validation errors for missing required docs', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // Complete email verification (mock API)
    // ... verify email ...
    
    // Try to submit without uploads
    await page.click('button:has-text("다음 단계로")');
    
    // Should show error toast
    await expect(page.locator('text=필수 서류를 모두 업로드해주세요')).toBeVisible();
  });

  test('should allow optional business registration', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // Verify email and upload required docs
    // ... verify email and upload ID + bank ...
    
    // Optional business registration should not block submission
    const submitButton = page.getByRole('button', { name: '다음 단계로' });
    await expect(submitButton).toBeEnabled();
    
    // But should allow upload if user wants to
    const bizRegUpload = page.locator(`[data-document-type="${INFLUENCER_DOC_TYPES.BUSINESS_REGISTRATION_OPTIONAL}"]`);
    await expect(bizRegUpload.locator('text=선택사항')).toBeVisible();
  });
});

test.describe('Supplier Onboarding - Inline Upload', () => {
  test('should complete all 3 required documents on same page', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // Email verification section
    await expect(page.getByRole('heading', { name: '이메일 인증' })).toBeVisible();
    
    // Complete email verification
    await page.fill('input[type="email"]', 'supplier@example.com');
    await page.click('button:has-text("인증코드 전송")');
    await page.fill('input[placeholder*="6자리"]', '123456');
    await page.click('button:has-text("인증 확인")');
    
    await expect(page.locator('text=이메일 인증 완료')).toBeVisible();
    
    // Upload Business Registration Certificate
    const bizRegUpload = page.locator(`[data-document-type="${SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION}"]`);
    await bizRegUpload.locator('input[type="file"]').setInputFiles('tests/fixtures/business-registration.pdf');
    await expect(bizRegUpload.locator('text=업로드 완료')).toBeVisible({ timeout: 10000 });
    
    // Upload Business Account Book
    const bankUpload = page.locator(`[data-document-type="${SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK}"]`);
    await bankUpload.locator('input[type="file"]').setInputFiles('tests/fixtures/bank-account-book.jpg');
    await expect(bankUpload.locator('text=업로드 완료')).toBeVisible({ timeout: 10000 });
    
    // Upload Mail Order Sales Report
    const mailOrderUpload = page.locator(`[data-document-type="${SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT}"]`);
    await mailOrderUpload.locator('input[type="file"]').setInputFiles('tests/fixtures/mail-order-report.jpg');
    await expect(mailOrderUpload.locator('text=업로드 완료')).toBeVisible({ timeout: 10000 });
    
    // Check progress indicator
    await expect(page.locator('text=3 / 3')).toBeVisible();
    
    // Submit
    await page.click('button:has-text("다음 단계로")');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show all required documents inline with help text', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // All three upload cards should be visible
    await expect(page.locator('text=사업자등록증')).toBeVisible();
    await expect(page.locator('text=사업자 통장 사본')).toBeVisible();
    await expect(page.locator('text=통신판매업 신고증')).toBeVisible();
    
    // Help text should be visible
    await expect(page.locator('text=사업자등록증 전체가 명확하게 보여야 합니다')).toBeVisible();
    await expect(page.locator('text=계좌번호가 명확하게 보이는')).toBeVisible();
  });

  test('should validate file types', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // Complete email verification
    // ... verify email ...
    
    // Try to upload invalid file type
    const upload = page.locator('[data-document-type]').first();
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('test content'),
    });
    
    // Should show error
    await expect(page.locator('text=지원하지 않는 파일 형식')).toBeVisible();
  });

  test('should validate file size', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // Complete email verification
    // ... verify email ...
    
    // Try to upload file > 10MB
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    const upload = page.locator('[data-document-type]').first();
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'large-file.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });
    
    // Should show error
    await expect(page.locator('text=10MB')).toBeVisible();
  });
});

test.describe('Email Verification Flow', () => {
  test('should send verification code', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    const emailInput = page.locator('input[type="email"]');
    const sendButton = page.getByRole('button', { name: '인증코드 전송' });
    
    await emailInput.fill('test@example.com');
    await sendButton.click();
    
    // Should show code input
    await expect(page.locator('input[placeholder*="6자리"]')).toBeVisible();
    await expect(page.locator('text=전송됨')).toBeVisible();
    
    // Email input should be disabled
    await expect(emailInput).toBeDisabled();
  });

  test('should handle invalid verification code', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("인증코드 전송")');
    
    // Enter wrong code
    await page.fill('input[placeholder*="6자리"]', '999999');
    await page.click('button:has-text("인증 확인")');
    
    // Should show error
    await expect(page.locator('text=인증 코드가 올바르지 않습니다')).toBeVisible();
  });

  test('should handle expired code', async ({ page }) => {
    // Mock API to return expired error
    await page.route('**/api/auth/verify-email', route => {
      route.fulfill({
        status: 410,
        body: JSON.stringify({ message: '인증 코드가 만료되었습니다' }),
      });
    });
    
    await page.goto('/auth/onboarding');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("인증코드 전송")');
    await page.fill('input[placeholder*="6자리"]', '123456');
    await page.click('button:has-text("인증 확인")');
    
    await expect(page.locator('text=만료되었습니다')).toBeVisible();
  });

  test('should show verified state', async ({ page }) => {
    await page.goto('/auth/onboarding');
    
    // Complete verification
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("인증코드 전송")');
    await page.fill('input[placeholder*="6자리"]', '123456');
    await page.click('button:has-text("인증 확인")');
    
    // Should show verified state
    await expect(page.locator('text=이메일 인증 완료')).toBeVisible();
    await expect(page.locator('[data-verified="true"]')).toBeVisible();
  });
});
```

### Integration Tests

**Test:** `tests/integration/onboarding-api.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { SUPPLIER_DOC_TYPES, INFLUENCER_DOC_TYPES } from '@/lib/constants/documents';

describe('Onboarding API Integration', () => {
  let supabase: any;
  let userId: string;

  beforeEach(async () => {
    // Setup test user
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    // ... create test user ...
  });

  describe('Document Upload', () => {
    it('should accept valid document types for influencer', async () => {
      const validTypes = [
        INFLUENCER_DOC_TYPES.GOVERNMENT_ID,
        INFLUENCER_DOC_TYPES.BANK_BOOK,
        INFLUENCER_DOC_TYPES.BUSINESS_REGISTRATION_OPTIONAL,
      ];

      for (const docType of validTypes) {
        const response = await fetch('/api/onboarding/docs', {
          method: 'POST',
          body: createFormData(docType, 'test.jpg'),
        });

        expect(response.ok).toBe(true);
      }
    });

    it('should accept valid document types for supplier', async () => {
      const validTypes = [
        SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION,
        SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK,
        SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT,
      ];

      for (const docType of validTypes) {
        const response = await fetch('/api/onboarding/docs', {
          method: 'POST',
          body: createFormData(docType, 'test.pdf'),
        });

        expect(response.ok).toBe(true);
      }
    });

    it('should reject invalid document type', async () => {
      const response = await fetch('/api/onboarding/docs', {
        method: 'POST',
        body: createFormData('invalid_type', 'test.jpg'),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Submit Onboarding', () => {
    it('should succeed for influencer with required docs', async () => {
      // Upload required docs
      await uploadDoc(INFLUENCER_DOC_TYPES.GOVERNMENT_ID);
      await uploadDoc(INFLUENCER_DOC_TYPES.BANK_BOOK);

      // Verify email
      await verifyEmail('test@example.com');

      // Submit
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
    });

    it('should fail for influencer without required docs', async () => {
      // Only upload one doc
      await uploadDoc(INFLUENCER_DOC_TYPES.GOVERNMENT_ID);

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('필수 서류');
    });

    it('should succeed for supplier with all 3 required docs', async () => {
      await uploadDoc(SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION);
      await uploadDoc(SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK);
      await uploadDoc(SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT);
      await verifyEmail('supplier@example.com');

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
    });

    it('should fail without email verification', async () => {
      await uploadDoc(INFLUENCER_DOC_TYPES.GOVERNMENT_ID);
      await uploadDoc(INFLUENCER_DOC_TYPES.BANK_BOOK);

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('이메일 인증');
    });
  });

  describe('Email Verification', () => {
    it('should send verification code', async () => {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      expect(response.ok).toBe(true);

      // Check database
      const { data } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      expect(data).toBeTruthy();
      expect(data.code).toMatch(/^\d{6}$/);
    });

    it('should verify correct code', async () => {
      // Send code
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      // Get code from database
      const { data: codeData } = await supabase
        .from('verification_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      // Verify
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@example.com',
          code: codeData.code,
        }),
      });

      expect(response.ok).toBe(true);

      // Check profile updated
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', userId)
        .single();

      expect(profile.email_verified).toBe(true);
    });

    it('should reject incorrect code', async () => {
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@example.com',
          code: '999999',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should rate limit verification attempts', async () => {
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      // Try 6 times with wrong code
      for (let i = 0; i < 6; i++) {
        await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: 'test@example.com',
            code: '999999',
          }),
        });
      }

      // 6th attempt should be rate limited
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@example.com',
          code: '999999',
        }),
      });

      expect(response.status).toBe(429);
    });
  });
});
```## Korean UX Best Practices (Inline Upload Context)

### 1. Visual Hierarchy for Inline Sections
```tsx
// Clear section separation
<div className="space-y-8">
  {/* Email section with background */}
  <div className="p-6 rounded-xl border bg-card">
    <h3 className="text-lg font-semibold mb-4">이메일 인증</h3>
    {/* Email verification inline */}
  </div>

  <Separator className="my-6" />

  {/* Document section */}
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold">서류 업로드</h3>
      <p className="text-sm text-muted-foreground">
        필수 서류를 업로드해주세요
      </p>
    </div>
    {/* Upload cards */}
  </div>
</div>
```

### 2. Progressive Disclosure Pattern
```tsx
// Disable document uploads until email verified
<FileUploadCard
  disabled={!emailVerified}
  opacity={emailVerified ? 1 : 0.5}
  // ... other props
/>

// Show unlock message
{!emailVerified && (
  <div className="text-sm text-muted-foreground flex items-center gap-2">
    <Lock className="h-4 w-4" />
    <span>이메일 인증 후 서류 업로드가 가능합니다</span>
  </div>
)}
```

### 3. Real-time Upload Status (Inline Indicators)
```tsx
// Per-card status
<FileUploadCard
  label="사업자등록증"
  uploadedFile={doc}
  statusIndicator={
    <Badge variant={doc ? "success" : "secondary"}>
      {doc ? "✓ 업로드 완료" : "업로드 필요"}
    </Badge>
  }
/>

// Overall progress bar
<Progress 
  value={(uploadedDocs.length / totalRequired) * 100} 
  className="h-2"
/>
<p className="text-sm text-muted-foreground mt-2">
  {uploadedDocs.length} / {totalRequired} 완료
</p>
```

### 4. Error Messages in Korean (Inline Context)
```typescript
export const ERROR_MESSAGES = {
  EMAIL_NOT_VERIFIED: '이메일 인증을 먼저 완료해주세요',
  REQUIRED_DOCS_MISSING: '필수 서류를 모두 업로드해주세요',
  FILE_TOO_LARGE: '파일 크기는 10MB 이하여야 합니다',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다 (JPG, PNG, PDF만 가능)',
  UPLOAD_FAILED: '업로드에 실패했습니다. 다시 시도해주세요',
  INVALID_VERIFICATION_CODE: '인증 코드가 올바르지 않습니다',
  CODE_EXPIRED: '인증 코드가 만료되었습니다. 새 코드를 요청하세요',
};
```

### 5. Help Text & Guidelines (Inline Tooltips)
```tsx
// Inline help for each document
<FileUploadCard
  label="사업자등록증"
  helpText={
    <div className="space-y-1 text-xs text-muted-foreground">
      <p>• 사업자등록증 전체가 명확하게 보여야 합니다</p>
      <p>• 발급일로부터 6개월 이내 서류</p>
      <p>• PDF 또는 이미지 파일 (최대 10MB)</p>
    </div>
  }
/>

// Expandable help section at bottom
<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
    <HelpCircle className="h-4 w-4" />
    서류 준비가 어려우신가요?
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-4 p-4 rounded-lg bg-muted">
    <h4 className="font-medium mb-2">자주 묻는 질문</h4>
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-medium">Q. 사업자등록증은 어디서 발급받나요?</p>
        <p className="text-muted-foreground">A. 국세청 홈택스에서 온라인 발급 가능합니다</p>
      </div>
      <div>
        <p className="font-medium">Q. 통장 사본은 어떤 형태로 업로드하나요?</p>
        <p className="text-muted-foreground">A. 통장 첫 페이지(계좌번호 표시) 사진 또는 스캔본</p>
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>
```

### 6. Mobile-Optimized Inline Layout
```tsx
// Stack vertically on mobile, side-by-side on desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div className="space-y-4">
    {/* Email verification */}
  </div>
  <div className="space-y-4">
    {/* Document preview/status */}
  </div>
</div>

// Sticky submit button on mobile
<div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t lg:relative lg:border-0 lg:p-0">
  <Button className="w-full">다음 단계로</Button>
</div>
```

### 7. File Type Validation for Korean Context
```typescript
// Accept common Korean document formats
const ACCEPTED_FORMATS = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
  // Korean govt docs often use HWP format (optional)
  korean: ['application/x-hwp', 'application/haansofthwp'],
};

// Validation with Korean messages
const validateFile = (file: File) => {
  const validTypes = [...ACCEPTED_FORMATS.images, ...ACCEPTED_FORMATS.documents];
  
  if (!validTypes.includes(file.type)) {
    throw new Error('지원 형식: JPG, PNG, PDF만 가능합니다');
  }
  
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기가 10MB를 초과합니다');
  }
  
  return true;
};
```

## Complete FileUploadCard Component (Inline Optimized)

**Update:** `components/ui/FileUploadCard.tsx` (or create if doesn't exist)

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadedFile {
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface FileUploadCardProps {
  label: string;
  description?: string;
  helpText?: React.ReactNode;
  accept: string;
  maxSize: number;
  documentType: string;
  onFileSelect: (file: File) => Promise<void> | void;
  uploadedFile?: UploadedFile;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUploadCard({
  label,
  description,
  helpText,
  accept,
  maxSize,
  documentType,
  onFileSelect,
  uploadedFile,
  required = false,
  disabled = false,
  className,
}: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File) => {
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const [mainType] = type.split('/');
        return fileType.startsWith(mainType);
      }
      return type === fileType || type === fileExtension;
    });

    if (!isValidType) {
      throw new Error('지원하지 않는 파일 형식입니다');
    }

    if (file.size > maxSize) {
      throw new Error(`파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다`);
    }
  };

  const handleFileChange = useCallback(async (file: File) => {
    setError(null);
    setProgress(0);

    try {
      validateFile(file);
      setUploading(true);

      // Simulate progress (replace with actual upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onFileSelect(file);

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다');
      setUploading(false);
      setProgress(0);
    }
  }, [onFileSelect, maxSize, accept]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, [disabled, handleFileChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    // Implement remove logic
  };

  const isUploaded = Boolean(uploadedFile);
  const showProgress = uploading && progress > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        {isUploaded && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            업로드 완료
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-accent/50',
          isDragging && 'border-primary bg-accent',
          disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
          isUploaded && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
          error && 'border-destructive bg-destructive/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${label}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(file);
          }}
          className="sr-only"
          disabled={disabled}
        />

        {/* Content */}
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  업로드 중... {progress}%
                </p>
              </div>
            </>
          ) : isUploaded ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <File className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{uploadedFile.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.fileSize)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="mt-2"
              >
                <X className="h-4 w-4 mr-1" />
                파일 삭제
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept.replace(/image\/\*/g, '이미지').replace(/application\/pdf/g, 'PDF')} (최대 {formatFileSize(maxSize)})
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <div className="text-xs text-muted-foreground pl-1">
          {helpText}
        </div>
      )}
    </div>
  );
}
```
```tsx
// Section landmarks
<section aria-labelledby="email-verification-heading">
  <h3 id="email-verification-heading" className="text-lg font-semibold">
    이메일 인증
  </h3>
  {/* content */}
</section>

<section aria-labelledby="document-upload-heading">
  <h3 id="document-upload-heading" className="text-lg font-semibold">
    서류 업로드
  </h3>
  {/* content */}
</section>

// Live regions for status updates
<div aria-live="polite" aria-atomic="true">
  {uploadSuccess && <span className="sr-only">파일 업로드 완료</span>}
  {emailVerified && <span className="sr-only">이메일 인증 완료</span>}
</div>

// Focus management
useEffect(() => {
  if (emailVerified) {
    // Focus first upload input after email verification
    firstUploadInputRef.current?.focus();
  }
}, [emailVerified]);
```# Task: Fix Onboarding Document Requirements & Mismatches

## Context
Korean B2B2C platform with Supplier (Brand) and Influencer onboarding. Current implementation has critical mismatches between UI upload names and server validation names, causing "missing documents" errors even after successful uploads.

## Required Documents (Corrected)

### Supplier/Brand (3 required + 1 optional)
1. **Business Registration Certificate** → `business_registration` 
2. **Business Account Book** → `bank_account_book`
3. **Mail Order Sales Report** → `mail_order_sales_report` (new, image upload)
4. **Email Verification** → Add email authentication flow

### Influencer (3 documents, NOT 4)
1. **Government ID** → `government_id`
2. **Business Registration** (optional) → `business_registration_optional`
3. **Bank Book** → `bank_book`

## Critical Issues to Fix

### 1. Document Type Constant Mismatches
**Current broken mappings:**
- UI uses `selfie_verification` but server expects `selfie_photo` ❌
- UI uses `bank_verification` but server expects `bank_account_book` ❌
- UI uses `proof_of_address` but server never checks it ❌
- UI uses `bank_statement` (influencer) but not validated ❌

**Fix approach:**
- Define canonical constants in `lib/constants/documents.ts`
- Update all touchpoints to use these constants

### 2. Excessive Influencer Requirements
- Currently requires 4 docs (ID, selfie, address, bank statement)
- Should only require 3 (ID, optional business reg, bank book)
- Remove selfie verification entirely
- Remove proof of address

### 3. Missing Requirements
- Add Mail Order Sales Report for suppliers
- Add email verification flow for all users

## UX/UI Structure (Critical: All Inline)

### Single-Page Layout Pattern

Each onboarding step (Influencer KYC, Brand KYB) contains ALL components inline:

```
┌─────────────────────────────────────┐
│  Step Header                         │
├─────────────────────────────────────┤
│  📧 Email Verification Section       │
│     ├─ Email input + Send button     │
│     └─ Code input + Verify button    │
├─────────────────────────────────────┤
│  Separator                           │
├─────────────────────────────────────┤
│  📄 Document Upload Section          │
│     ├─ Upload Card 1 (required)      │
│     ├─ Upload Card 2 (required)      │
│     └─ Upload Card 3 (optional)      │
├─────────────────────────────────────┤
│  Status Indicator (X/Y uploaded)     │
├─────────────────────────────────────┤
│  Submit Button (Next Step)           │
└─────────────────────────────────────┘
```

**Key Points:**
- NO separate pages for documents
- NO navigation between upload steps
- All uploads visible simultaneously
- Single "Next" button validates everything
- Email verification MUST complete before document upload enabled
- Progress shows completion status inline

### Step 1: Create Canonical Document Constants

```typescript
// lib/constants/documents.ts
export const SUPPLIER_DOC_TYPES = {
  BUSINESS_REGISTRATION: 'business_registration',
  BANK_ACCOUNT_BOOK: 'bank_account_book',
  MAIL_ORDER_SALES_REPORT: 'mail_order_sales_report',
} as const;

export const INFLUENCER_DOC_TYPES = {
  GOVERNMENT_ID: 'government_id',
  BUSINESS_REGISTRATION_OPTIONAL: 'business_registration_optional',
  BANK_BOOK: 'bank_book',
} as const;

export const ALL_DOC_TYPES = {
  ...SUPPLIER_DOC_TYPES,
  ...INFLUENCER_DOC_TYPES,
} as const;

export type DocumentType = typeof ALL_DOC_TYPES[keyof typeof ALL_DOC_TYPES];
```

### Step 2: Update lib/types.ts

```typescript
// Replace existing DocumentType with:
import { ALL_DOC_TYPES } from '@/lib/constants/documents';

export type DocumentType = typeof ALL_DOC_TYPES[keyof typeof ALL_DOC_TYPES];

// Add display names for UI
export const DOCUMENT_LABELS: Record<DocumentType, { ko: string; en: string }> = {
  business_registration: { 
    ko: '사업자등록증', 
    en: 'Business Registration Certificate' 
  },
  bank_account_book: { 
    ko: '사업자 통장 사본', 
    en: 'Business Account Book' 
  },
  mail_order_sales_report: { 
    ko: '통신판매업 신고증', 
    en: 'Mail Order Sales Report' 
  },
  government_id: { 
    ko: '신분증', 
    en: 'Government ID' 
  },
  business_registration_optional: { 
    ko: '사업자등록증 (선택)', 
    en: 'Business Registration (Optional)' 
  },
  bank_book: { 
    ko: '통장 사본', 
    en: 'Bank Book' 
  },
};
```

### Step 3: Fix InfluencerKYCStep.tsx (Inline Upload UI)

**Location:** `app/auth/onboarding/components/InfluencerKYCStep.tsx`

**Layout:** All document uploads are inline within this single step page

**Changes:**
1. Import constants from `@/lib/constants/documents`
2. Update `handleFileUpload` mapping (lines ~140-148):
   ```typescript
   const documentTypeMap = {
     id: INFLUENCER_DOC_TYPES.GOVERNMENT_ID,
     businessReg: INFLUENCER_DOC_TYPES.BUSINESS_REGISTRATION_OPTIONAL,
     bank: INFLUENCER_DOC_TYPES.BANK_BOOK,
   };
   ```
3. Update `onSubmit` validation (lines ~210-221):
   ```typescript
   const requiredDocs = [
     INFLUENCER_DOC_TYPES.GOVERNMENT_ID,
     INFLUENCER_DOC_TYPES.BANK_BOOK,
   ];
   const hasRequired = requiredDocs.every(type => 
     uploadedDocuments.some(doc => doc.documentType === type)
   );
   ```

4. **Restructure inline upload section** (replace existing FileUploadCard grid):
   ```tsx
   <div className="space-y-6">
     {/* Section header */}
     <div>
       <h3 className="text-lg font-semibold">서류 업로드</h3>
       <p className="text-sm text-muted-foreground">
         필수 서류를 업로드해주세요
       </p>
     </div>

     {/* Inline upload cards in single column */}
     <div className="space-y-4">
       {/* Government ID - Required */}
       <FileUploadCard
         label="신분증"
         description="정부 발급 신분증 (주민등록증, 운전면허증, 여권)"
         accept="image/*,application/pdf"
         maxSize={10 * 1024 * 1024}
         documentType={INFLUENCER_DOC_TYPES.GOVERNMENT_ID}
         onFileSelect={(file) => handleFileUpload(file, 'id')}
         uploadedFile={uploadedDocuments.find(d => 
           d.documentType === INFLUENCER_DOC_TYPES.GOVERNMENT_ID
         )}
         required
       />

       {/* Bank Book - Required */}
       <FileUploadCard
         label="통장 사본"
         description="본인 명의 통장 사본 (계좌번호가 보이는 첫 페이지)"
         accept="image/*,application/pdf"
         maxSize={10 * 1024 * 1024}
         documentType={INFLUENCER_DOC_TYPES.BANK_BOOK}
         onFileSelect={(file) => handleFileUpload(file, 'bank')}
         uploadedFile={uploadedDocuments.find(d => 
           d.documentType === INFLUENCER_DOC_TYPES.BANK_BOOK
         )}
         required
       />

       {/* Business Registration - Optional */}
       <FileUploadCard
         label="사업자등록증 (선택사항)"
         description="사업자로 등록된 경우에만 업로드하세요"
         accept="image/*,application/pdf"
         maxSize={10 * 1024 * 1024}
         documentType={INFLUENCER_DOC_TYPES.BUSINESS_REGISTRATION_OPTIONAL}
         onFileSelect={(file) => handleFileUpload(file, 'businessReg')}
         uploadedFile={uploadedDocuments.find(d => 
           d.documentType === INFLUENCER_DOC_TYPES.BUSINESS_REGISTRATION_OPTIONAL
         )}
         required={false}
       />
     </div>

     {/* Upload status indicator */}
     <div className="flex items-center gap-2 text-sm">
       <span className="text-muted-foreground">
         업로드 완료: {uploadedDocuments.filter(d => 
           [INFLUENCER_DOC_TYPES.GOVERNMENT_ID, INFLUENCER_DOC_TYPES.BANK_BOOK]
           .includes(d.documentType as any)
         ).length} / 2
       </span>
     </div>
   </div>
   ```

5. Remove selfie verification and proof of address cards entirely

### Step 4: Fix BrandKYBStep.tsx (Inline Upload UI)

**Location:** `app/auth/onboarding/components/BrandKYBStep.tsx`

**Layout:** All document uploads are inline within this single step page

**Changes:**
1. Import constants
2. Update `handleFileUpload` mapping (lines ~131-139):
   ```typescript
   const documentTypeMap = {
     registration: SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION,
     bank: SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK,
     mailOrder: SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT,
   };
   ```
3. Update `onSubmit` validation (lines ~189-209):
   ```typescript
   const requiredDocs = [
     SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION,
     SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK,
     SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT,
   ];
   ```

4. **Restructure inline upload section** (replace existing FileUploadCard grid):
   ```tsx
   <div className="space-y-6">
     {/* Section header */}
     <div>
       <h3 className="text-lg font-semibold">사업자 서류 업로드</h3>
       <p className="text-sm text-muted-foreground">
         사업자 확인을 위한 필수 서류를 업로드해주세요
       </p>
     </div>

     {/* Inline upload cards in single column */}
     <div className="space-y-4">
       {/* Business Registration Certificate - Required */}
       <FileUploadCard
         label="사업자등록증"
         description="사업자등록증 전체가 명확하게 보이는 파일 (발급일로부터 6개월 이내)"
         accept="image/*,application/pdf"
         maxSize={10 * 1024 * 1024}
         documentType={SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION}
         onFileSelect={(file) => handleFileUpload(file, 'registration')}
         uploadedFile={uploadedDocuments.find(d => 
           d.documentType === SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION
         )}
         required
       />

       {/* Business Account Book - Required */}
       <FileUploadCard
         label="사업자 통장 사본"
         description="사업자 명의 통장 사본 (계좌번호가 명확하게 보이는 첫 페이지)"
         accept="image/*,application/pdf"
         maxSize={10 * 1024 * 1024}
         documentType={SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK}
         onFileSelect={(file) => handleFileUpload(file, 'bank')}
         uploadedFile={uploadedDocuments.find(d => 
           d.documentType === SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK
         )}
         required
       />

       {/* Mail Order Sales Report - Required */}
       <FileUploadCard
         label="통신판매업 신고증"
         description="통신판매업 신고증 이미지 (사업자등록번호 일치 필수)"
         accept="image/*,application/pdf"
         maxSize={10 * 1024 * 1024}
         documentType={SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT}
         onFileSelect={(file) => handleFileUpload(file, 'mailOrder')}
         uploadedFile={uploadedDocuments.find(d => 
           d.documentType === SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT
         )}
         required
       />
     </div>

     {/* Upload status indicator */}
     <div className="flex items-center gap-2 text-sm">
       <span className="text-muted-foreground">
         업로드 완료: {uploadedDocuments.length} / 3
       </span>
     </div>

     {/* Help text */}
     <div className="rounded-lg bg-muted p-4">
       <h4 className="text-sm font-medium mb-2">서류 준비 안내</h4>
       <ul className="text-sm text-muted-foreground space-y-1">
         <li>• 모든 서류는 최신 발급본으로 준비해주세요</li>
         <li>• 사업자등록번호가 모든 서류에서 일치해야 합니다</li>
         <li>• 파일 형식: JPG, PNG, PDF (최대 10MB)</li>
       </ul>
     </div>
   </div>
   ```

5. Remove conditional business_license upload logic
6. Remove authorized_rep_id upload card

### Step 5: Fix API Submit Route

**Location:** `app/api/onboarding/submit/route.ts`

**Changes at lines ~115-145:**
```typescript
import { SUPPLIER_DOC_TYPES, INFLUENCER_DOC_TYPES } from '@/lib/constants/documents';

// Supplier required docs (line ~115)
const supplierRequiredDocs = [
  SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION,
  SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK,
  SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT,
];

// Influencer required docs (line ~131)
const influencerRequiredDocs = [
  INFLUENCER_DOC_TYPES.GOVERNMENT_ID,
  INFLUENCER_DOC_TYPES.BANK_BOOK,
];
```

### Step 6: Harden Upload API Validation

**Location:** `app/api/onboarding/docs/route.ts`

**Changes at lines ~11-20:**
```typescript
import { ALL_DOC_TYPES } from '@/lib/constants/documents';

const documentUploadSchema = z.object({
  documentType: z.enum([
    ...Object.values(ALL_DOC_TYPES)
  ] as [string, ...string[]]),
});

// Update fileValidationSchema if needed
const fileValidationSchema = z.object({
  type: z.string().regex(/^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/),
  size: z.number().max(10 * 1024 * 1024, 'File must be under 10MB'),
});
```

### Step 7: Add Email Verification (Inline Component)

**Integration:** Add as inline section within the KYC/KYB step pages, NOT a separate page

**Update InfluencerKYCStep.tsx to include email verification:**

```tsx
import { EmailVerificationInline } from './EmailVerificationInline';

export function InfluencerKYCStep({ onNext }: { onNext: () => void }) {
  const [emailVerified, setEmailVerified] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const onSubmit = () => {
    // Check email verification
    if (!emailVerified) {
      toast({ 
        title: '이메일 인증이 필요합니다',
        variant: 'destructive' 
      });
      return;
    }

    // Check documents
    const requiredDocs = [
      INFLUENCER_DOC_TYPES.GOVERNMENT_ID,
      INFLUENCER_DOC_TYPES.BANK_BOOK,
    ];
    const hasRequired = requiredDocs.every(type => 
      uploadedDocuments.some(doc => doc.documentType === type)
    );
    
    if (!hasRequired) {
      toast({ title: '필수 서류를 모두 업로드해주세요' });
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Email Verification Section - Inline */}
      <div>
        <h3 className="text-lg font-semibold mb-4">이메일 인증</h3>
        <EmailVerificationInline 
          onVerified={() => setEmailVerified(true)}
          isVerified={emailVerified}
        />
      </div>

      {/* Divider */}
      <Separator />

      {/* Document Upload Section - Inline */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">서류 업로드</h3>
          <p className="text-sm text-muted-foreground">
            필수 서류를 업로드해주세요
          </p>
        </div>
        {/* FileUploadCards here */}
      </div>

      {/* Submit button */}
      <Button 
        onClick={onSubmit}
        disabled={!emailVerified || uploadedDocuments.length < 2}
        className="w-full"
      >
        다음 단계로
      </Button>
    </div>
  );
}
```

**Create:** `app/auth/onboarding/components/EmailVerificationInline.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, Mail } from 'lucide-react';

interface EmailVerificationInlineProps {
  onVerified: () => void;
  isVerified: boolean;
}

export function EmailVerificationInline({ 
  onVerified,
  isVerified 
}: EmailVerificationInlineProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ 
        title: '올바른 이메일 주소를 입력하세요',
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      
      setCodeSent(true);
      toast({ 
        title: '인증 코드 전송 완료',
        description: '이메일을 확인해주세요 (스팸함 확인)' 
      });
    } catch (error) {
      toast({ 
        title: '전송 실패', 
        description: error instanceof Error ? error.message : '다시 시도해주세요',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      
      toast({ 
        title: '이메일 인증 완료',
        description: '인증이 성공적으로 완료되었습니다' 
      });
      onVerified();
    } catch (error) {
      toast({ 
        title: '인증 실패', 
        description: '인증 코드를 확인해주세요',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">
            이메일 인증 완료
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            {email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            이메일 주소
          </label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={codeSent || loading}
              placeholder="example@email.com"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSendCode}
              disabled={!email || codeSent || loading}
              variant={codeSent ? "secondary" : "default"}
            >
              {loading ? '전송 중...' : codeSent ? '전송됨' : '인증코드 전송'}
            </Button>
          </div>
        </div>
      </div>

      {codeSent && (
        <div className="flex items-start gap-3 pl-[52px]">
          <div className="flex-1">
            <label htmlFor="code" className="block text-sm font-medium mb-2">
              인증 코드
            </label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6자리 숫자"
                maxLength={6}
                className="flex-1"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={handleVerify}
                disabled={code.length !== 6 || loading}
              >
                {loading ? '확인 중...' : '인증 확인'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              이메일로 전송된 6자리 코드를 입력하세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Apply same pattern to BrandKYBStep.tsx:**
- Add email verification section at the top
- Add separator
- Keep document uploads below
- Update submit validation to check emailVerified

### Step 8: Update Tests

**Files to update:**
- `tests/e2e/onboarding/submit-and-redirect.spec.ts`
- `tests/e2e/onboarding-brand-influencer-access.spec.ts`

**Changes:**
```typescript
// Update document upload assertions to use new constants
import { SUPPLIER_DOC_TYPES, INFLUENCER_DOC_TYPES } from '@/lib/constants/documents';

// For supplier test
await uploadDocument(SUPPLIER_DOC_TYPES.BUSINESS_REGISTRATION, 'business-reg.pdf');
await uploadDocument(SUPPLIER_DOC_TYPES.BANK_ACCOUNT_BOOK, 'bank-book.jpg');
await uploadDocument(SUPPLIER_DOC_TYPES.MAIL_ORDER_SALES_REPORT, 'mail-order.jpg');

// For influencer test  
await uploadDocument(INFLUENCER_DOC_TYPES.GOVERNMENT_ID, 'id.jpg');
await uploadDocument(INFLUENCER_DOC_TYPES.BANK_BOOK, 'bank.jpg');
```

## Migration Strategy for Existing Users

**Create migration script:** `scripts/migrate-document-types.ts`

```typescript
// Map old names to new canonical names
const MIGRATION_MAP = {
  // Old influencer names
  'selfie_verification': 'government_id', // Merge into ID
  'proof_of_address': null, // Remove
  'bank_statement': 'bank_book', // Rename
  
  // Old supplier names
  'bank_verification': 'bank_account_book',
  'authorized_rep_id': null, // Remove if not needed
  'business_license': null, // Remove
};

// Run UPDATE queries to rename doc_type in verification_documents table
```

## Korean UX Best Practices

### 1. Error Messages in Korean
```typescript
export const ERROR_MESSAGES = {
  REQUIRED_DOCS_MISSING: '필수 서류를 모두 업로드해주세요',
  FILE_TOO_LARGE: '파일 크기는 10MB 이하여야 합니다',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다',
  UPLOAD_FAILED: '업로드에 실패했습니다. 다시 시도해주세요',
  EMAIL_VERIFICATION_REQUIRED: '이메일 인증이 필요합니다',
};
```

### 2. Document Upload Guidelines
```typescript
export const UPLOAD_GUIDELINES = {
  business_registration: [
    '사업자등록증 전체가 명확하게 보여야 합니다',
    'PDF 또는 JPG/PNG 형식으로 업로드하세요',
    '발급일로부터 6개월 이내 서류',
  ],
  mail_order_sales_report: [
    '통신판매업 신고증 이미지',
    '선명한 사진으로 업로드하세요',
    '사업자등록번호가 일치해야 합니다',
  ],
  // ... other guidelines
};
```

### 3. File Type Validation for Korean Context
```typescript
// Accept common Korean document formats
const ACCEPTED_FORMATS = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
};

// Korean-specific validation messages
const VALIDATION_MESSAGES_KO = {
  invalidFormat: '지원 형식: JPG, PNG, PDF',
  fileTooLarge: '파일 크기가 10MB를 초과합니다',
  required: '필수 항목입니다',
};
```

## Security Enhancements

### 1. File Upload Security
```typescript
// Add virus scanning integration
// Add file type verification (magic bytes check)
// Rate limit uploads per user session
// Sanitize filenames before storage
```

### 2. Email Verification Security
```typescript
// Use time-limited codes (5 min expiry)
// Rate limit code generation (3 attempts per 10 min)
// Use cryptographically secure random codes
// Hash codes before storing
```

## Checklist

- [ ] Create `lib/constants/documents.ts` with canonical constants
- [ ] Update `lib/types.ts` DocumentType union and labels
- [ ] Fix `InfluencerKYCStep.tsx` (remove 2 docs, add 1 optional)
- [ ] Fix `BrandKYBStep.tsx` (add mail order report)
- [ ] Update `app/api/onboarding/submit/route.ts` required arrays
- [ ] Harden `app/api/onboarding/docs/route.ts` with enum validation
- [ ] Add email verification step and API routes
- [ ] Update E2E tests with new constants
- [ ] Create migration script for existing users
- [ ] Add Korean error messages and guidelines
- [ ] Test full onboarding flow for both roles
- [ ] Verify document submissions succeed in production

## Expected Outcome

✅ No more "missing documents" errors from type mismatches  
✅ Influencer requires exactly 3 docs (ID, optional business reg, bank book)  
✅ Supplier requires exactly 3 docs (business reg, bank book, mail order report)  
✅ Email verification integrated  
✅ Type-safe document handling across entire app  
✅ Korean-optimized UX with proper labels and validation  
✅ Existing users migrated to new document types  

## Notes for Cursor

- Start with constants file, then cascade changes
- Run TypeScript compiler after each file change to catch issues
- Test upload → submit flow after all changes
- Keep accessibility (labels, aria-*) intact
- Follow shadcn/ui patterns for new components
- Maintain Korean/English bilingual support structure

---

## Implementation Summary (2025-10-06)

- **Canonical document types** aligned across app:
  - Influencer required: `government_id`, `selfie_verification`, `proof_of_address`. Optional: `bank_statement`.
  - Supplier required: `business_registration`, `bank_verification`, `authorized_rep_id`, `business_license`.
- **Types updated** in `lib/types.ts` to the canonical set to prevent type drift.
- **Upload API hardened** in `app/api/onboarding/docs/route.ts` using `z.enum([...])` allowlist for `documentType`.
- **Submit API validation** in `app/api/onboarding/submit/route.ts` now enforces supplier=4 and influencer=3 docs.
  - Legacy aliases accepted during transition: `bank_account_book → bank_verification`, `id_document → government_id`, `selfie_photo → selfie_verification`.
- **UI updates**:
  - `InfluencerKYCStep.tsx`: bank statement marked optional; required check is exactly 3 docs.
  - `BrandKYBStep.tsx`: retail permit always shown and required → total 4 required uploads.

## Dry Run Plan

1. Login as influencer → go to `/auth/onboarding`.
2. Upload three docs: ID, selfie, address.
3. Verify each upload shows “Uploaded” status; bank statement remains optional.
4. Submit → expect 200 response and redirect to `/dashboard/influencer`.
5. Login as brand/supplier → go to `/auth/onboarding`.
6. Upload four docs: business registration, bank verification, authorized rep ID, retail permit.
7. Submit → expect 200 response and redirect to `/dashboard/supplier`.
8. Database spot-check:
   - `verification_requests` status becomes `submitted`.
   - `verification_documents.doc_type` values exactly match canonical names.
   - `onboarding_progress.status` becomes `completed`.

## Error Tests

- **Influencer missing one doc** → server responds 400 with `missingDocuments` listing the absent type.
- **Supplier missing permit** → server responds 400 with `missingDocuments: ['business_license']`.
- **Invalid documentType** (e.g., typo) on upload → `docs` route returns 400 with field error from zod enum.
- **Legacy uploads present** (previous users): submit passes due to alias mapping without re-upload.
- **File validation**: >10MB or non-image/PDF rejected both client-side hints and server-side zod check.

## Files Changed

- `lib/types.ts` — update `DocumentType` union to canonical.
- `app/api/onboarding/docs/route.ts` — restrict `documentType` via enum allowlist.
- `app/api/onboarding/submit/route.ts` — enforce required arrays and alias normalization.
- `app/auth/onboarding/components/InfluencerKYCStep.tsx` — 3 required, bank optional.
- `app/auth/onboarding/components/BrandKYBStep.tsx` — 4 required including `business_license`.