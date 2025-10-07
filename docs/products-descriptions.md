# Product Descriptions (Short & Long)

This repo now supports:

- **`products.short_description`** — a 120–160 char one-liner shown on catalog cards and useful for SEO snippets.
- **`products.description`** — full PDP copy; currently rendered as plain text with preserved line breaks.

## Where Used

- **Feed API** (`/api/main-shop/feed`) returns `short_description` in each item.
- **Cards** (`components/shop/MainShopCard.tsx`) show `short_description` if present.
- **PDP** can render long text via `components/product/ProductDescription.tsx`.
- **Supplier Forms** can include both fields via `components/forms/ProductDescriptionsFields.tsx`
  (works with or without react-hook-form).

## Migrations

Run the SQL in `sql/migrations/004-products-descriptions.sql` using your Supabase SQL editor or migration runner:

```bash
# For Supabase CLI
supabase db push

# Or manually via psql
psql -h your-db-host -U your-user -d your-db -f sql/migrations/004-products-descriptions.sql
```

## Wiring PDP

In your product page (e.g., `app/shop/[handle]/product/[id]/page.tsx`), fetch `description` and render:

```tsx
import ProductDescription from "@/components/product/ProductDescription";
// ...
<ProductDescription description={product.description} />
```

## Supplier Forms

### Example (React Hook Form):
```tsx
import ProductDescriptionsFields from "@/components/forms/ProductDescriptionsFields";
// ...
<ProductDescriptionsFields register={register} setValue={setValue} watch={watch} />
```

### Example (Controlled):
```tsx
const [shortDesc, setShortDesc] = useState("");
const [longDesc, setLongDesc] = useState("");
// ...
<ProductDescriptionsFields
  shortValue={shortDesc}
  longValue={longDesc}
  onShortChange={setShortDesc}
  onLongChange={setLongDesc}
/>
```

## Type Definitions

The `MainShopProduct` interface in `types/catalog.ts` now includes:

```typescript
export interface MainShopProduct {
  // ... existing fields
  /** Short one-liner used on cards and SEO snippets (≈120–160 chars) */
  short_description?: string | null;
  /** Full PDP content (plain text for now; can be Markdown later) */
  description?: string | null;
}
```

## Best Practices

### Short Description (120-160 chars)
- Keep it concise and compelling
- Focus on key benefits or features
- Optimize for SEO meta descriptions
- Use action-oriented language

### Long Description
- Include detailed product information
- Cover features, materials, sizing, care instructions
- Add warranty and shipping information
- Use short paragraphs and line breaks for readability
- Consider adding bullet points for key features

## Future Enhancements

- **Markdown Support**: Convert description field to support Markdown formatting
- **Rich Text Editor**: Add WYSIWYG editor for description field
- **SEO Optimization**: Automatic meta description generation from short_description
- **Multi-language Support**: Add translation fields for descriptions
