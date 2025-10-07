export type SortKey = "new" | "price-asc" | "price-desc";

export interface MainShopProduct {
  id: string;
  title: string;
  price: number;
  primary_image: string | null;
  active: boolean;
  in_stock: boolean;
  stock_count: number;
  category?: string | null;
  brand?: string | null;
  created_at: string;
}

export interface FeedResponse {
  items: MainShopProduct[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
