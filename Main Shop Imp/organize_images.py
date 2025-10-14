import os
from pathlib import Path
import json
import shutil

class ImageOrganizer:
    """
    Organize downloaded product images and create URL templates.
    """
    
    def __init__(self, images_folder: str):
        self.images_folder = Path(images_folder)
        self.output_folder = self.images_folder.parent / "Organized_Products"
        
    def organize_images(self, products: list):
        """
        Organize images by product and create reference documents.
        
        Args:
            products: List of product dictionaries
        """
        print(f"{'='*70}")
        print("Organizing Product Images")
        print(f"{'='*70}\n")
        
        # Create output folder
        self.output_folder.mkdir(exist_ok=True)
        
        product_mapping = []
        all_images = list(self.images_folder.glob("*.webp"))
        
        print(f"Found {len(all_images)} images in: {self.images_folder}\n")
        
        for i, product in enumerate(products, 1):
            sku = product.get('sku', product['name'].lower().replace(' ', '-'))
            
            # Create product folder
            product_folder = self.output_folder / sku
            product_folder.mkdir(exist_ok=True)
            
            # Find images for this product
            product_images = [img for img in all_images if img.stem.startswith(sku)]
            
            if not product_images:
                print(f"⚠ No images found for: {product['name']} (SKU: {sku})")
                continue
            
            print(f"[{i}/{len(products)}] {product['name']}")
            print(f"  SKU: {sku}")
            print(f"  Images found: {len(product_images)}")
            
            # Copy images to product folder
            image_info = []
            for j, img in enumerate(sorted(product_images), 1):
                dest = product_folder / img.name
                shutil.copy2(img, dest)
                
                # Determine image type
                img_type = "primary" if j == 1 else f"gallery-{j-1}"
                
                image_info.append({
                    "filename": img.name,
                    "type": img_type,
                    "local_path": str(dest),
                    "upload_path": f"new-products/{img.name}",
                    "future_url": f"[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/{img.name}"
                })
                
                print(f"    ✓ {img.name} → {img_type}")
            
            # Add to product mapping
            product_mapping.append({
                "id": i,
                "name": product['name'],
                "sku": sku,
                "price": product['price'],
                "category": product['category'],
                "brand": product['brand'],
                "folder": str(product_folder),
                "images": image_info
            })
            
            print()
        
        # Save JSON mapping
        json_file = self.output_folder / "product_image_mapping.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(product_mapping, f, indent=2, ensure_ascii=False)
        
        # Create README
        self._create_readme(product_mapping)
        
        # Create SQL template
        self._create_sql_template(product_mapping)
        
        print(f"{'='*70}")
        print("Organization Complete!")
        print(f"{'='*70}")
        print(f"\n✓ Images organized in: {self.output_folder}")
        print(f"✓ Mapping saved to: product_image_mapping.json")
        print(f"✓ Instructions saved to: README.txt")
        print(f"✓ SQL template saved to: insert_products_template.sql")
        
        return product_mapping
    
    def _create_readme(self, product_mapping: list):
        """Create a README with instructions."""
        readme = self.output_folder / "README.txt"
        
        content = f"""
{'='*70}
PRODUCT IMAGES - ORGANIZATION & UPLOAD GUIDE
{'='*70}

Total Products: {len(product_mapping)}
Total Images: {sum(len(p['images']) for p in product_mapping)}

{'='*70}
FOLDER STRUCTURE
{'='*70}

"""
        for product in product_mapping:
            content += f"\n{product['sku']}/\n"
            for img in product['images']:
                content += f"  ├─ {img['filename']} ({img['type']})\n"
        
        content += f"""

{'='*70}
HOW TO UPLOAD TO SUPABASE
{'='*70}

1. Go to your Supabase Dashboard
2. Navigate to: Storage → product-images bucket
3. Create a folder: "new-products"
4. Upload all images from each product folder

OR

5. Use the upload script: python upload_to_supabase.py

{'='*70}
AFTER UPLOADING
{'='*70}

1. Get the public URLs from Supabase Storage
2. Update insert_products_template.sql with actual URLs
3. Run the SQL in your Supabase SQL Editor

URLs will be in format:
https://[your-project].supabase.co/storage/v1/object/public/product-images/new-products/[filename].webp

{'='*70}
PRODUCT DETAILS
{'='*70}

"""
        
        for product in product_mapping:
            content += f"""
Product: {product['name']}
SKU: {product['sku']}
Price: ${product['price']}
Category: {product['category']}
Brand: {product['brand']}
Primary Image: {product['images'][0]['filename']}
Gallery Images: {len(product['images']) - 1}
"""
        
        with open(readme, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def _create_sql_template(self, product_mapping: list):
        """Create SQL template with placeholder URLs."""
        sql_file = self.output_folder / "insert_products_template.sql"
        
        sql = f"""-- ============================================
-- INSERT NEW PRODUCTS WITH IMAGE URLS
-- ============================================
-- Total Products: {len(product_mapping)}
-- 
-- INSTRUCTIONS:
-- 1. Upload images to Supabase Storage
-- 2. Replace [YOUR_SUPABASE_URL] with your actual Supabase project URL
-- 3. Run this SQL in Supabase SQL Editor
-- ============================================

"""
        
        for product in product_mapping:
            primary_image = product['images'][0]
            
            sql += f"""
-- {product['name']}
INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    '{product['name']}',
    '{product['sku']}',
    {product['price']},
    '{product['category']}',
    '{product['brand']}',
    '[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/{primary_image['filename']}',
    NOW()
);

"""
        
        sql += """
-- ============================================
-- VERIFY INSERTS
-- ============================================
SELECT * FROM products WHERE sku IN (
"""
        skus = [f"    '{p['sku']}'" for p in product_mapping]
        sql += ",\n".join(skus)
        sql += "\n);\n"
        
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write(sql)


# Main execution
if __name__ == "__main__":
    # Define your products
    products = [
        {
            "name": "Canon EOS R6 Mark II Camera",
            "sku": "CANON-EOS-R6-MKII",
            "price": 2499.99,
            "category": "Electronics",
            "brand": "Canon"
        },
        {
            "name": "Nike Air Zoom Pegasus 40",
            "sku": "NIKE-PEGASUS-40",
            "price": 139.99,
            "category": "Footwear",
            "brand": "Nike"
        },
        {
            "name": "Fjallraven Kanken 17\" Laptop Backpack",
            "sku": "FJALLRAVEN-KANKEN-17",
            "price": 115.00,
            "category": "Accessories",
            "brand": "Fjallraven"
        },
        {
            "name": "Logitech MX Master 3S Wireless Mouse",
            "sku": "LOGITECH-MX-MASTER-3S",
            "price": 99.99,
            "category": "Electronics",
            "brand": "Logitech"
        },
        {
            "name": "Patagonia Nano Puff Jacket",
            "sku": "PATAGONIA-NANO-PUFF",
            "price": 249.00,
            "category": "Apparel",
            "brand": "Patagonia"
        }
    ]
    
    # Organize images
    images_folder = r"C:\Users\Lenovo\Desktop\Workspce\vo-onelink-google\Main Shop Imp\Images2"
    
    organizer = ImageOrganizer(images_folder)
    mapping = organizer.organize_images(products)
    
    print("\n" + "="*70)
    print("WHAT'S NEXT?")
    print("="*70)
    print("\n1. Review images in 'Organized_Products' folder")
    print("2. Each product has its own folder with all images")
    print("3. Image #1 in each folder = primary image for product card")
    print("4. Images #2-3 = gallery images")
    print("\n5. When ready to upload:")
    print("   → Manually upload to Supabase Storage, OR")
    print("   → Run: python upload_to_supabase.py")
    print("\n6. After upload, update insert_products_template.sql with URLs")
    print("7. Run the SQL in Supabase SQL Editor")
    print("\n" + "="*70)