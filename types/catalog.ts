export type SortKey = "new" | "price-asc" | "price-desc";

export interface MainShopProduct {
  id: string;
  title: string;
  price: number;
  primary_image: string | null;
  images?: string[] | null; // Added for carousel functionality
  active: boolean;
  in_stock: boolean;
  stock_count: number;
  category?: string | null;
  brand?: string | null;
  created_at: string;
  /** Short one-liner used on cards and SEO snippets (≈120–160 chars) */
  short_description?: string | null;
  /** Full PDP content (plain text for now; can be Markdown later) */
  description?: string | null;
}

export interface FeedResponse {
  items: MainShopProduct[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
