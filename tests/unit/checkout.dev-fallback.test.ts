import { describe, it, expect } from 'vitest';
import { isDevFallbackAllowed, validateClientProduct } from '@/lib/checkout/devFallback';

describe('DEV fallback guards', () => {
  it('does not allow fallback in production regardless of flag', () => {
    expect(isDevFallbackAllowed({ NODE_ENV: 'production', DEV_FALLBACK: 'true' } as any)).toBe(false);
    expect(isDevFallbackAllowed({ NODE_ENV: 'production', DEV_FALLBACK: 'false' } as any)).toBe(false);
    expect(isDevFallbackAllowed({ NODE_ENV: 'production' } as any)).toBe(false);
  });

  it('requires DEV_FALLBACK === "true" outside production', () => {
    expect(isDevFallbackAllowed({ NODE_ENV: 'development', DEV_FALLBACK: 'true' } as any)).toBe(true);
    expect(isDevFallbackAllowed({ NODE_ENV: 'development', DEV_FALLBACK: 'false' } as any)).toBe(false);
    expect(isDevFallbackAllowed({ NODE_ENV: 'test', DEV_FALLBACK: 'true' } as any)).toBe(true);
    expect(isDevFallbackAllowed({ NODE_ENV: 'test' } as any)).toBe(false);
  });
});

describe('validateClientProduct()', () => {
  const base = {
    id: 'p1',
    title: 'Product',
    description: 'desc',
    price: 10,
    images: ['https://example.com/img.png'],
    supplier_id: 'sup_1',
    commission: 5,
    stock_count: 3,
  };

  it('accepts a valid candidate', () => {
    const r = validateClientProduct(base);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects invalid fields and enumerates errors', () => {
    const r = validateClientProduct({
      ...base,
      supplier_id: '',
      price: 'NaN',
      stock_count: 1.5,
      images: [123],
      commission: 500,
      title: 123,
      description: 999,
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        'supplier_id: must be non-empty string',
        'price: must be a finite number >= 0',
        'stock_count: must be an integer 0..1000',
        'images: must be an array of strings',
        'commission: must be numeric within 0..100',
        'title: must be string',
        'description: must be string',
      ])
    );
  });
});
