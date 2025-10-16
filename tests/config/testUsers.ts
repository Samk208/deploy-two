// Centralized test users configuration for E2E and integration tests
// One source of truth: all tests and seed utilities must import from here.

type TestUser = { email: string; password: string };

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`[TEST CONFIG] Missing required env: ${name}`);
  }
  return value;
}

export const TEST_USERS: {
  ADMIN: TestUser;
  SUPPLIER: TestUser;
  INFLUENCER: TestUser;
} = {
  ADMIN: {
    email: requireEnv("TEST_ADMIN_EMAIL", "test.admin+e2e@test.local"),
    password: requireEnv("TEST_ADMIN_PASSWORD", "TestAdmin123!"),
  },
  SUPPLIER: {
    email: requireEnv("TEST_SUPPLIER_EMAIL", "test.brand+e2e@test.local"),
    // Pick ONE canonical supplier password and keep it consistent across the repo
    password: requireEnv("TEST_SUPPLIER_PASSWORD", "NewBrandPassword123!"),
  },
  INFLUENCER: {
    email: requireEnv("TEST_INFLUENCER_EMAIL", "audio.avenue@example.com"),
    password: requireEnv("TEST_INFLUENCER_PASSWORD", "24690H"),
  },
};

export type { TestUser };
