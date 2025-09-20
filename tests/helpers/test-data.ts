// tests/helpers/test-data.ts

// Minimal valid PDF file buffer for upload tests
export function generateSamplePdf() {
  const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000121 00000 n \n0000000213 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n322\n%%EOF`
  const buffer = Buffer.from(pdfContent, 'utf-8')
  return { name: 'sample.pdf', mimeType: 'application/pdf', buffer }
}

export const testUsers = {
  influencer: {
    email: 'test.influencer+e2e@test.local',
    password: 'Password123!',
  },
  brand: {
    email: 'test.brand+e2e@test.local',
    password: 'Password123!',
  },
  admin: {
    email: 'test.admin+e2e@test.local',
    password: 'Password123!',
  },
}

export const productData = {
  name: 'E2E Product Upload',
  description: 'Product created during E2E tests',
  price: 2599,
  currency: 'USD' as const,
}
