
======================================================================
PRODUCT IMAGES - ORGANIZATION & UPLOAD GUIDE
======================================================================

Total Products: 5
Total Images: 15

======================================================================
FOLDER STRUCTURE
======================================================================


CANON-EOS-R6-MKII/
  ├─ CANON-EOS-R6-MKII-1.webp (primary)
  ├─ CANON-EOS-R6-MKII-2.webp (gallery-1)
  ├─ CANON-EOS-R6-MKII-3.webp (gallery-2)

NIKE-PEGASUS-40/
  ├─ NIKE-PEGASUS-40-1.webp (primary)
  ├─ NIKE-PEGASUS-40-2.webp (gallery-1)
  ├─ NIKE-PEGASUS-40-3.webp (gallery-2)

FJALLRAVEN-KANKEN-17/
  ├─ FJALLRAVEN-KANKEN-17-1.webp (primary)
  ├─ FJALLRAVEN-KANKEN-17-2.webp (gallery-1)
  ├─ FJALLRAVEN-KANKEN-17-3.webp (gallery-2)

LOGITECH-MX-MASTER-3S/
  ├─ LOGITECH-MX-MASTER-3S-1.webp (primary)
  ├─ LOGITECH-MX-MASTER-3S-2.webp (gallery-1)
  ├─ LOGITECH-MX-MASTER-3S-3.webp (gallery-2)

PATAGONIA-NANO-PUFF/
  ├─ PATAGONIA-NANO-PUFF-1.webp (primary)
  ├─ PATAGONIA-NANO-PUFF-2.webp (gallery-1)
  ├─ PATAGONIA-NANO-PUFF-3.webp (gallery-2)


======================================================================
HOW TO UPLOAD TO SUPABASE
======================================================================

1. Go to your Supabase Dashboard
2. Navigate to: Storage → product-images bucket
3. Create a folder: "new-products"
4. Upload all images from each product folder

OR

5. Use the upload script: python upload_to_supabase.py

======================================================================
AFTER UPLOADING
======================================================================

1. Get the public URLs from Supabase Storage
2. Update insert_products_template.sql with actual URLs
3. Run the SQL in your Supabase SQL Editor

URLs will be in format:
https://[your-project].supabase.co/storage/v1/object/public/product-images/new-products/[filename].webp

======================================================================
PRODUCT DETAILS
======================================================================


Product: Canon EOS R6 Mark II Camera
SKU: CANON-EOS-R6-MKII
Price: $2499.99
Category: Electronics
Brand: Canon
Primary Image: CANON-EOS-R6-MKII-1.webp
Gallery Images: 2

Product: Nike Air Zoom Pegasus 40
SKU: NIKE-PEGASUS-40
Price: $139.99
Category: Footwear
Brand: Nike
Primary Image: NIKE-PEGASUS-40-1.webp
Gallery Images: 2

Product: Fjallraven Kanken 17" Laptop Backpack
SKU: FJALLRAVEN-KANKEN-17
Price: $115.0
Category: Accessories
Brand: Fjallraven
Primary Image: FJALLRAVEN-KANKEN-17-1.webp
Gallery Images: 2

Product: Logitech MX Master 3S Wireless Mouse
SKU: LOGITECH-MX-MASTER-3S
Price: $99.99
Category: Electronics
Brand: Logitech
Primary Image: LOGITECH-MX-MASTER-3S-1.webp
Gallery Images: 2

Product: Patagonia Nano Puff Jacket
SKU: PATAGONIA-NANO-PUFF
Price: $249.0
Category: Apparel
Brand: Patagonia
Primary Image: PATAGONIA-NANO-PUFF-1.webp
Gallery Images: 2
