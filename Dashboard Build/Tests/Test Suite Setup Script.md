#!/bin/bash

# Test Suite Setup Script
# Run: chmod +x setup-tests.sh && ./setup-tests.sh

set -e

echo "🚀 Setting up comprehensive test suite..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Install dependencies
echo -e "\n${BLUE}📦 Installing test dependencies...${NC}"
pnpm add -D @playwright/test @axe-core/playwright

# 2. Install Playwright browsers
echo -e "\n${BLUE}🌐 Installing Playwright browsers...${NC}"
pnpm exec playwright install --with-deps

# 3. Create directory structure
echo -e "\n${BLUE}📁 Creating directory structure...${NC}"
mkdir -p tests/e2e/auth
mkdir -p tests/e2e/onboarding
mkdir -p tests/e2e/checkout
mkdir -p tests/e2e/middleware
mkdir -p tests/e2e/api
mkdir -p tests/e2e/dashboard
mkdir -p tests/e2e/image-gallery
mkdir -p tests/debug
mkdir -p tests/helpers
mkdir -p tests/fixtures
mkdir -p test-screenshots
mkdir -p test-failures
mkdir -p test-results
mkdir -p diagnostic-output
mkdir -p scripts

# 4. Create test fixture file
echo -e "\n${BLUE}📄 Creating test fixtures...${NC}"
cat > tests/fixtures/test-document.pdf << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000341 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
433
%%EOF
EOF

# 5. Update package.json scripts
echo -e "\n${BLUE}⚙️  Updating package.json scripts...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = pkg.scripts || {};
pkg.scripts['test:e2e'] = 'playwright test';
pkg.scripts['test:e2e:ui'] = 'playwright test --ui';
pkg.scripts['test:e2e:debug'] = 'playwright test --debug';
pkg.scripts['test:e2e:headed'] = 'playwright test --headed';
pkg.scripts['test:e2e:report'] = 'playwright show-report';
pkg.scripts['test:diagnostics'] = 'node scripts/run-diagnostics.ts';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Scripts updated');
"

# 6. Create .env.test.local if it doesn't exist
if [ ! -f .env.test.local ]; then
  echo -e "\n${BLUE}🔐 Creating .env.test.local...${NC}"
  cat > .env.test.local << 'EOF'
# Test Credentials
TEST_SUPPLIER_EMAIL=test.supplier@test.local
TEST_SUPPLIER_PASSWORD=SupplierPassword123!
TEST_INFLUENCER_EMAIL=test.influencer@test.local
TEST_INFLUENCER_PASSWORD=InfluencerPassword123!

# Test Shop
TEST_SHOP_HANDLE=test-shop

# Base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Copy your actual test database credentials here
# DATABASE_URL=postgresql://...
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
EOF
  echo -e "${YELLOW}⚠️  Please update .env.test.local with your actual test credentials${NC}"
else
  echo -e "${GREEN}✅ .env.test.local already exists${NC}"
fi

# 7. Create Playwright config if it doesn't exist
if [ ! -f playwright.config.ts ]; then
  echo -e "\n${BLUE}⚙️  Creating playwright.config.ts...${NC}"
  cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
EOF
  echo -e "${GREEN}✅ playwright.config.ts created${NC}"
else
  echo -e "${GREEN}✅ playwright.config.ts already exists${NC}"
fi

# 8. Create .gitignore entries
echo -e "\n${BLUE}📝 Updating .gitignore...${NC}"
cat >> .gitignore << 'EOF'

# Test outputs
test-screenshots/
test-failures/
test-results/
diagnostic-output/
playwright-report/
.env.test.local
EOF

# 9. Create diagnostic runner script
echo -e "\n${BLUE}🔧 Creating diagnostic runner script...${NC}"
cat > scripts/run-diagnostics.ts << 'EOF'
// Copy the content from the test_runner_diagnostic artifact here
// This file should contain the DiagnosticRunner class
EOF

echo -e "\n${GREEN}✨ Test suite setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update .env.test.local with your test database credentials"
echo "2. Create test users in your database:"
echo "   - Supplier: test.supplier@test.local"
echo "   - Influencer: test.influencer@test.local"
echo "3. Run tests: pnpm test:e2e"
echo "4. Run diagnostics: pnpm test:diagnostics"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "- View test configuration: cat playwright.config.ts"
echo "- View test helpers: ls tests/helpers/"
echo "- View test suites: ls tests/e2e/"
echo ""
echo -e "${GREEN}🚀 Ready to test!${NC}"