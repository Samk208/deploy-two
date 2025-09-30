import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Module under test
import * as diag from '../../scripts/checkout-diagnostics';

// Helper to reset env per test
function setEnv(secret: string | undefined, publishable: string | undefined) {
  if (secret === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = secret;
  if (publishable === undefined) delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishable;
}

// Dynamic mocks
let fsState: Record<string, string> = {};

vi.mock('fs', () => {
  return {
    default: {},
    existsSync: (p: string) => Object.prototype.hasOwnProperty.call(fsState, p),
    readFileSync: (p: string) => fsState[p],
  } as any;
});

// Stripe mock: we will override behavior per test by setting spies
class StripeAccount {
  retrieve = vi.fn(async () => ({ id: 'acct_123', email: 'acct@example.com', charges_enabled: true }));
}
class StripeCheckoutSessions {
  create = vi.fn(async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test_123' }));
  retrieve = vi.fn(async (id: string) => ({ id }));
}
class StripeCheckout { sessions = new StripeCheckoutSessions(); }
class StripeMock {
  account = new StripeAccount();
  checkout = new StripeCheckout();
  constructor(_key: string, _opts: any) {}
}
vi.mock('stripe', () => ({ default: StripeMock }));

// Global fetch mock; overridden in tests as needed
const defaultFetch = vi.fn(async (input: RequestInfo | URL) => {
  if (String(input).includes('/api/checkout')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ sessionId: 'cs_test_123', url: 'https://checkout.stripe.com/test_123' }),
      text: async () => 'OK',
    } as any;
  }
  return { ok: true, status: 200, json: async () => ({}), text: async () => 'OK' } as any;
});

// Utility to build repo-like paths
const path = require('path');
const repo = (p: string) => path.join(process.cwd(), p);

describe('checkout-diagnostics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    // default env
    setEnv('sk_test_abc', 'pk_test_abc');
    // default fetch
    (global as any).fetch = defaultFetch;
    fsState = {};
    diag.clearResults();
  });

  afterEach(() => {
    diag.clearResults();
  });

  describe('checkStripeKeys()', () => {
    it('fails if secret key missing', async () => {
      setEnv(undefined, 'pk_test_abc');
      const ok = await diag.checkStripeKeys();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step === 'Stripe Secret Key' && r.status === 'fail')).toBe(true);
    });

    it('fails if secret key format invalid', async () => {
      setEnv('not_a_key', 'pk_test_abc');
      const ok = await diag.checkStripeKeys();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step.includes('Secret Key Format') && r.status === 'fail')).toBe(true);
    });

    it('fails if publishable key missing', async () => {
      setEnv('sk_test_abc', undefined);
      const ok = await diag.checkStripeKeys();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step === 'Stripe Publishable Key' && r.status === 'fail')).toBe(true);
    });

    it('fails if publishable key format invalid', async () => {
      setEnv('sk_test_abc', 'nope');
      const ok = await diag.checkStripeKeys();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step.includes('Publishable Key Format') && r.status === 'fail')).toBe(true);
    });

    it('fails if key environments mismatch', async () => {
      setEnv('sk_live_abc', 'pk_test_abc');
      const ok = await diag.checkStripeKeys();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step === 'Stripe Key Pair' && r.status === 'fail')).toBe(true);
    });

    it('passes on valid matching keys', async () => {
      setEnv('sk_test_abc', 'pk_test_abc');
      const ok = await diag.checkStripeKeys();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Stripe Secret Key')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Stripe Publishable Key')?.status).toBe('pass');
    });
  });

  describe('testStripeConnection()', () => {
    it('fails when no API key', async () => {
      setEnv(undefined, 'pk_test_abc');
      const ok = await diag.testStripeConnection();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step === 'Stripe Connection' && r.status === 'fail')).toBe(true);
    });

    it('passes and warns based on account flags', async () => {
      const mock = new StripeMock('sk_test_abc', {});
      mock.account.retrieve = vi.fn(async () => ({ id: 'acct_1', charges_enabled: false }));
      // swap constructor behavior for this test
      (StripeMock as any).mockImplementationOnce?.(() => mock);
      const ok = await diag.testStripeConnection();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Stripe Connection')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Account Status')?.status).toBe('warning');
    });
  });

  describe('testCheckoutSessionCreation()', () => {
    it('fails when no API key', async () => {
      setEnv(undefined, 'pk_test_abc');
      const ok = await diag.testCheckoutSessionCreation();
      expect(ok).toBe(false);
      expect(diag.results.some(r => r.step === 'Session Creation' && r.status === 'fail')).toBe(true);
    });

    it('passes when session created and retrievable', async () => {
      const ok = await diag.testCheckoutSessionCreation();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Session Creation')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Session Retrieval')?.status).toBe('pass');
    });
  });

  describe('testAPIRoute()', () => {
    it('fails on non-ok response', async () => {
      (global as any).fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'err' } as any));
      const ok = await diag.testAPIRoute();
      expect(ok).toBe(false);
      expect(diag.results.find(r => r.step === 'API Route')?.status).toBe('fail');
    });

    it('fails on missing fields', async () => {
      (global as any).fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) } as any));
      const ok = await diag.testAPIRoute();
      expect(ok).toBe(false);
      expect(diag.results.find(r => r.step === 'API Route Response')?.status).toBe('fail');
    });

    it('passes on valid response', async () => {
      (global as any).fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ sessionId: 'cs', url: 'https://checkout.stripe.com/ok' }) } as any));
      const ok = await diag.testAPIRoute();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'API Route')?.status).toBe('pass');
    });
  });

  describe('checkClientSideCode()', () => {
    it('fails when checkout page missing', () => {
      fsState = {}; // no files
      const ok = diag.checkClientSideCode();
      expect(ok).toBe(false);
      expect(diag.results.find(r => r.step === 'Checkout Page')?.status).toBe('fail');
    });

    it('passes page existence and warns about component if missing', () => {
      fsState[repo('app/checkout/page.tsx')] = 'export default function Page() { return null }';
      const ok = diag.checkClientSideCode();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Checkout Page')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Checkout Component')?.status).toBe('warning');
    });

    it('passes and checks component heuristics', () => {
      fsState[repo('app/checkout/page.tsx')] = 'export default function Page() { return null }';
      fsState[repo('components/shop/checkout-page.tsx')] = `
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        function go(url:string){ window.location.href = url }
        async function onPay(){ try { await fetch('/api'); } catch(e){} }
        export default function C(){ const loading = false; return null }
      `;
      const ok = diag.checkClientSideCode();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Stripe Key Usage')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Redirect Logic')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Error Handling')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Loading States')?.status).toBe('pass');
    });
  });

  describe('checkSuccessPage()', () => {
    it('fails when missing', () => {
      fsState = {};
      const ok = diag.checkSuccessPage();
      expect(ok).toBe(false);
      expect(diag.results.find(r => r.step === 'Success Page')?.status).toBe('fail');
    });

    it('passes and warns if session id not referenced', () => {
      fsState[repo('app/checkout/success/page.tsx')] = 'export default function P(){ return null }';
      const ok = diag.checkSuccessPage();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Success Page')?.status).toBe('pass');
      expect(diag.results.find(r => r.step.includes('Session ID'))?.status).toBe('warning');
    });

    it('passes and session id check passes', () => {
      fsState[repo('app/checkout/success/page.tsx')] = 'const session_id = "abc"; export default function P(){ return null }';
      const ok = diag.checkSuccessPage();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step.includes('Session ID'))?.status).toBe('pass');
    });
  });

  describe('checkCartStore()', () => {
    it('warns when no store found', async () => {
      fsState = {};
      const ok = await diag.checkCartStore();
      expect(ok).toBe(false);
      expect(diag.results.find(r => r.step === 'Cart Store')?.status).toBe('warning');
    });

    it('passes when zustand store with items array', async () => {
      fsState[repo('lib/stores/cart.ts')] = `import { create } from 'zustand';
        type Item = { id: string };
        export const useCart = create<{ items: Item[]; getItems: ()=>Item[] }>(()=>({ items: [], getItems(){ return [] } }));`;
      const ok = await diag.checkCartStore();
      expect(ok).toBe(true);
      expect(diag.results.find(r => r.step === 'Cart Store')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Cart Store Implementation')?.status).toBe('pass');
      expect(diag.results.find(r => r.step === 'Cart Items')?.status).toBe('pass');
    });
  });

  describe('runAllDiagnostics()', () => {
    it('short-circuits when keys invalid', async () => {
      setEnv(undefined, undefined);
      const res = await diag.runAllDiagnostics();
      expect(res.success).toBe(false);
      expect(res.results.some(r => r.status === 'fail')).toBe(true);
    });

    it('runs full suite on valid env', async () => {
      setEnv('sk_test_abc', 'pk_test_abc');
      // Create minimal files for file-based checks
      fsState[repo('app/checkout/page.tsx')] = '';
      fsState[repo('app/checkout/success/page.tsx')] = 'const session_id = "x";';
      fsState[repo('components/shop/checkout-page.tsx')] = 'const k = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; try{}catch(e){} const loading = true; window.location.href = "";';
      fsState[repo('lib/store/cart.ts')] = 'import { create } from "zustand"; export const s = create({ items: [] });';

      const res = await diag.runAllDiagnostics();
      expect(res.success).toBe(true);
      expect(res.results.every(r => r.status !== 'fail')).toBe(true);
    });
  });
});
