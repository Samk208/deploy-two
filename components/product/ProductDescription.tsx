"use client";

/**
 * Lightweight renderer for long product description.
 * Uses plain text with preserved line breaks; swap to Markdown later if needed.
 *
 * @component
 * @example
 * <ProductDescription description={product.description} />
 */
export default function ProductDescription({
  description
}: {
  description?: string | null
}) {
  if (!description) return null;

  return (
    <section className="prose max-w-none mt-6 whitespace-pre-line">
      {description}
    </section>
  );
}
