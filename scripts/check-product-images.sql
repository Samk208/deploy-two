-- Check Product Images Status
-- Verify that products have multiple images as expected

-- Check current products and their image count
SELECT
    id,
    title,
    brand,
    array_length (images, 1) as image_count,
    primary_image IS NOT NULL as has_primary,
    CASE
        WHEN array_length (images, 1) >= 3 THEN 'Perfect (3+ images) ✓'
        WHEN array_length (images, 1) = 2 THEN 'Good (2 images) ✓'
        WHEN array_length (images, 1) = 1 THEN 'Minimal (1 image) ⚠️'
        WHEN images IS NULL
        OR array_length (images, 1) = 0 THEN 'No images ❌'
        ELSE 'Unknown'
    END as image_status
FROM products
WHERE
    active = true
ORDER BY array_length (images, 1) DESC, title;

-- Summary statistics
SELECT
    'IMAGE STATISTICS' as check_type,
    COUNT(*) as total_products,
    COUNT(*) FILTER (
        WHERE
            array_length (images, 1) >= 3
    ) as products_with_3plus_images,
    COUNT(*) FILTER (
        WHERE
            array_length (images, 1) = 2
    ) as products_with_2_images,
    COUNT(*) FILTER (
        WHERE
            array_length (images, 1) = 1
    ) as products_with_1_image,
    COUNT(*) FILTER (
        WHERE
            images IS NULL
            OR array_length (images, 1) = 0
    ) as products_with_no_images,
    ROUND(
        AVG(array_length (images, 1)),
        2
    ) as avg_images_per_product
FROM products
WHERE
    active = true;

-- Show sample of image URLs for verification
SELECT 
  'SAMPLE IMAGE URLS' as check_type,
  title,
  images[1] as first_image,
  images[2] as second_image,
  images[3] as third_image
FROM products 
WHERE active = true 
  AND array_length(images, 1) >= 2
LIMIT 3;