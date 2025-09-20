-- Create RPC function for atomic stock updates
-- This prevents race conditions when updating product stock

CREATE OR REPLACE FUNCTION update_product_stock(
  product_id_param UUID,
  quantity_to_subtract INTEGER
)
RETURNS TABLE(
  id UUID,
  stock_count INTEGER,
  in_stock BOOLEAN,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Perform atomic update with stock validation
  UPDATE products 
  SET 
    stock_count = GREATEST(stock_count - quantity_to_subtract, 0),
    in_stock = (GREATEST(stock_count - quantity_to_subtract, 0) > 0),
    updated_at = NOW()
  WHERE products.id = product_id_param
    AND stock_count >= quantity_to_subtract  -- Only update if sufficient stock
  RETURNING 
    products.id,
    products.stock_count,
    products.in_stock,
    TRUE as success,
    NULL as error_message
  INTO id, stock_count, in_stock, success, error_message;

  -- If no rows were updated, check if product exists
  IF NOT FOUND THEN
    -- Check if product exists
    IF EXISTS (SELECT 1 FROM products WHERE products.id = product_id_param) THEN
      -- Product exists but insufficient stock
      SELECT 
        products.id,
        products.stock_count,
        products.in_stock,
        FALSE as success,
        'Insufficient stock' as error_message
      FROM products 
      WHERE products.id = product_id_param
      INTO id, stock_count, in_stock, success, error_message;
    ELSE
      -- Product doesn't exist
      SELECT 
        product_id_param,
        0,
        FALSE,
        FALSE,
        'Product not found'
      INTO id, stock_count, in_stock, success, error_message;
    END IF;
  END IF;

  RETURN NEXT;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION update_product_stock(UUID, INTEGER) TO service_role;
