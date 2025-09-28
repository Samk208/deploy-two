# Contrast Report

Using tokens from tokens/design-tokens.json

| Case | Pair | Ratio | AA | AAA |
|---|---|---:|:--:|:--:|
| Text on white (text-900) | #111827 on #FFFFFF | 17.74:1 | PASS | PASS |
| Text on bg-soft (text-700) | #374151 on #F9FAFB | 9.86:1 | PASS | PASS |
| Brand on white (brand-600) | #4F46E5 on #FFFFFF | 6.29:1 | PASS | FAIL |
| White on brand (brand-600) | #FFFFFF on #4F46E5 | 6.29:1 | PASS | FAIL |

## Palette (hex)
- brand: #E0E7FF, #C7D2FE, #A5B4FC, #818CF8, #6366F1, #4F46E5, #4338CA
- accent: #FBBF24, #F59E0B
- neutrals: #111827, #374151, #F9FAFB, #FFFFFF