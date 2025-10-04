-- Enforce uniqueness for shop handles and influencer-product links
-- Use unique indexes (equivalent to constraints for our purposes) and IF NOT EXISTS for idempotency

-- Ensure unique shop handles
CREATE UNIQUE INDEX IF NOT EXISTS shops_handle_unique_idx ON public.shops (handle);

-- Ensure an influencer can't link the same product twice
CREATE UNIQUE INDEX IF NOT EXISTS isp_influencer_product_unique_idx
  ON public.influencer_shop_products (influencer_id, product_id);
