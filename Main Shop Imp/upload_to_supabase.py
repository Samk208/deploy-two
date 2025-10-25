import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import mimetypes

class SupabaseImageUploader:
    """
    Upload product images to Supabase Storage and get public URLs.
    """
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None, bucket_name: str = "product-images"):
        """
        Initialize Supabase client.
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase anon/service key
            bucket_name: Storage bucket name (default: "product-images")
        """
        # Load from .env.local if not provided
        env_file = r"C:\Users\Lenovo\Desktop\Workspce\vo-onelink-google\.env.local"
        load_dotenv(env_file)
        
        self.url = supabase_url or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.key = supabase_key or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        self.bucket_name = bucket_name
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL and Key required. Check your .env.local file.")
        
        # Initialize Supabase client
        self.supabase: Client = create_client(self.url, self.key)
        
        print(f"✓ Connected to Supabase")
        print(f"✓ Bucket: {self.bucket_name}\n")
    
    def upload_image(self, file_path: Path, storage_path: str = None) -> str:
        """
        Upload a single image to Supabase Storage.
        
        Args:
            file_path: Local path to the image file
            storage_path: Path in storage bucket (defaults to filename)
            
        Returns:
            Public URL of uploaded image
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Use filename as storage path if not specified
        if storage_path is None:
            storage_path = file_path.name
        
        try:
            # Read file as bytes
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Get mimetype
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if mime_type is None:
                mime_type = 'image/webp'
            
            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": mime_type, "upsert": "true"}
            )
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            file_size = len(file_data) / 1024  # KB
            print(f"✓ Uploaded: {file_path.name} ({file_size:.1f} KB)")
            print(f"  URL: {public_url}")
            
            return public_url
            
        except Exception as e:
            print(f"✗ Failed to upload {file_path.name}: {e}")
            return None
    
    def upload_folder(self, folder_path: str, file_pattern: str = "*.webp", 
                     storage_subfolder: str = "sample-products") -> dict:
        """
        Upload all images from a folder to Supabase Storage.
        
        Args:
            folder_path: Path to folder containing images
            file_pattern: File pattern to match (default: "*.webp")
            storage_subfolder: Subfolder in storage bucket
            
        Returns:
            Dictionary mapping filename to public URL
        """
        folder = Path(folder_path)
        
        if not folder.exists():
            raise FileNotFoundError(f"Folder not found: {folder}")
        
        # Get all matching files
        image_files = sorted(folder.glob(file_pattern))
        
        if not image_files:
            print(f"No files matching '{file_pattern}' found in {folder}")
            return {}
        
        print(f"{'='*70}")
        print(f"Uploading {len(image_files)} images to Supabase Storage")
        print(f"{'='*70}\n")
        
        url_map = {}
        
        for i, file_path in enumerate(image_files, 1):
            print(f"[{i}/{len(image_files)}]")
            
            # Create storage path with subfolder
            storage_path = f"{storage_subfolder}/{file_path.name}" if storage_subfolder else file_path.name
            
            public_url = self.upload_image(file_path, storage_path)
            
            if public_url:
                url_map[file_path.name] = public_url
            
            print()
        
        print(f"{'='*70}")
        print(f"Upload Summary: {len(url_map)}/{len(image_files)} successful")
        print(f"{'='*70}\n")
        
        return url_map
    
    def generate_product_sql(self, url_map: dict, products: list) -> str:
        """
        Generate SQL INSERT statements with image URLs.
        
        Args:
            url_map: Dictionary mapping filename to URL
            products: List of product dictionaries
            
        Returns:
            SQL INSERT statements as string
        """
        sql_statements = []
        
        print("="*70)
        print("SQL INSERT Statements with Image URLs")
        print("="*70)
        print()
        
        for product in products:
            sku = product.get('sku', product['name'].lower().replace(' ', '-'))
            primary_image_key = f"{sku}-1.webp"
            
            if primary_image_key in url_map:
                sql = f"""INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    '{product['name']}',
    '{sku}',
    {product['price']},
    '{product['category']}',
    '{product['brand']}',
    '{url_map[primary_image_key]}',
    NOW()
);"""
                sql_statements.append(sql)
                print(sql)
                print()
        
        return "\n\n".join(sql_statements)


# Main execution
if __name__ == "__main__":
    # Define your products (same as download script)
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
    
    try:
        # Initialize uploader (will read from .env.local)
        uploader = SupabaseImageUploader(bucket_name="product-images")
        
        # Upload all images from Images2 folder
        images_folder = r"C:\Users\Lenovo\Desktop\Workspce\vo-onelink-google\Main Shop Imp\Images2"
        
        url_map = uploader.upload_folder(
            folder_path=images_folder,
            file_pattern="*.webp",
            storage_subfolder="new-products"  # Organize in subfolder
        )
        
        # Generate SQL with URLs
        if url_map:
            print("\n")
            sql = uploader.generate_product_sql(url_map, products)
            
            # Save SQL to file
            sql_file = Path(images_folder).parent / "insert_products.sql"
            with open(sql_file, 'w', encoding='utf-8') as f:
                f.write(sql)
            
            print(f"\n✓ SQL saved to: {sql_file}")
            print("\nImage URLs by product:")
            for filename, url in url_map.items():
                print(f"  {filename}: {url}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nMake sure your .env.local has:")
        print("  NEXT_PUBLIC_SUPABASE_URL=your_url")
        print("  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key")