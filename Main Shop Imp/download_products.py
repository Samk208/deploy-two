import requests
import os
import time
from pathlib import Path
from typing import List, Dict
import json
from dotenv import load_dotenv

# Load environment variables from .env.local (specific path)
env_file = r"C:\Users\Lenovo\Desktop\Workspce\vo-onelink-google\.env.local"
load_dotenv(env_file)
print(f"✓ Loading environment from: {env_file}")
print(f"✓ API Key found: {'Yes' if os.getenv('UNSPLASH_ACCESS_KEY') else 'No - Please check your .env.local file'}")
print()

class ProductImageDownloader:
    """
    Robust product image downloader supporting multiple sources.
    Uses Unsplash API for high-quality, royalty-free product images.
    """
    
    def __init__(self, access_key: str = None, output_dir: str = "product_images"):
        """
        Initialize the downloader.
        
        Args:
            access_key: Unsplash API access key (get free at unsplash.com/developers)
            output_dir: Directory to save downloaded images
        """
        self.access_key = access_key or os.getenv('UNSPLASH_ACCESS_KEY')
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.base_url = "https://api.unsplash.com"
        
    def search_images(self, query: str, count: int = 3, orientation: str = "squarish") -> List[Dict]:
        """
        Search for product images on Unsplash.
        
        Args:
            query: Search term (e.g., "canon camera", "nike sneakers")
            count: Number of images to retrieve (max 30 per request)
            orientation: "landscape", "portrait", "squarish"
            
        Returns:
            List of image data dictionaries
        """
        if not self.access_key:
            raise ValueError("Unsplash access key required. Set UNSPLASH_ACCESS_KEY env variable or pass to constructor.")
        
        headers = {"Authorization": f"Client-ID {self.access_key}"}
        params = {
            "query": query,
            "per_page": min(count, 30),
            "orientation": orientation,
            "content_filter": "high"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/search/photos",
                headers=headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            images = []
            for result in data.get('results', [])[:count]:
                images.append({
                    'id': result['id'],
                    'url': result['urls']['raw'],
                    'download_url': result['links']['download_location'],
                    'width': result['width'],
                    'height': result['height'],
                    'photographer': result['user']['name'],
                    'photographer_url': result['user']['links']['html']
                })
            
            return images
            
        except requests.exceptions.RequestException as e:
            print(f"Error searching images for '{query}': {e}")
            return []
    
    def download_image(self, image_data: Dict, filename: str, size: str = "1200x1200") -> bool:
        """
        Download a single image with specified dimensions.
        
        Args:
            image_data: Image data dictionary from search_images()
            filename: Output filename (without extension)
            size: Image size in format "WIDTHxHEIGHT" (e.g., "1200x1200")
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Build download URL with size parameters
            url = f"{image_data['url']}&w={size.split('x')[0]}&h={size.split('x')[1]}&fit=crop&fm=webp&q=85"
            
            # Trigger download endpoint (Unsplash requirement)
            if self.access_key and image_data.get('download_url'):
                headers = {"Authorization": f"Client-ID {self.access_key}"}
                requests.get(image_data['download_url'], headers=headers, timeout=5)
            
            # Download the image
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Save to file
            filepath = self.output_dir / f"{filename}.webp"
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_size = filepath.stat().st_size / 1024  # KB
            print(f"✓ Downloaded: {filepath.name} ({file_size:.1f} KB)")
            return True
            
        except Exception as e:
            print(f"✗ Failed to download {filename}: {e}")
            return False
    
    def download_product_images(self, products: List[Dict], images_per_product: int = 3):
        """
        Download images for multiple products.
        
        Args:
            products: List of product dictionaries with 'name' and 'sku' keys
            images_per_product: Number of images to download per product
        """
        total = len(products) * images_per_product
        downloaded = 0
        
        print(f"\n{'='*60}")
        print(f"Downloading {images_per_product} images for {len(products)} products ({total} total)")
        print(f"{'='*60}\n")
        
        for i, product in enumerate(products, 1):
            product_name = product['name']
            sku = product.get('sku', product_name.lower().replace(' ', '-'))
            search_query = product.get('search_query', product_name)
            
            print(f"[{i}/{len(products)}] {product_name}")
            print(f"Searching: '{search_query}'")
            
            # Search for images
            images = self.search_images(search_query, count=images_per_product)
            
            if not images:
                print(f"✗ No images found for '{search_query}'\n")
                continue
            
            # Download each image
            for j, img_data in enumerate(images, 1):
                filename = f"{sku}-{j}"
                if self.download_image(img_data, filename):
                    downloaded += 1
                time.sleep(0.5)  # Rate limiting courtesy
            
            print(f"Photographer credits: {', '.join(set(img['photographer'] for img in images))}\n")
            time.sleep(1)  # Rate limiting between products
        
        print(f"{'='*60}")
        print(f"Download complete: {downloaded}/{total} images successful")
        print(f"Images saved to: {self.output_dir.absolute()}")
        print(f"{'='*60}\n")


# Example usage
if __name__ == "__main__":
    # Define your new products
    new_products = [
        {
            "name": "Canon EOS R6 Mark II Camera",
            "sku": "CANON-EOS-R6-MKII",
            "search_query": "canon eos r6 camera professional"
        },
        {
            "name": "Nike Air Zoom Pegasus 40",
            "sku": "NIKE-PEGASUS-40",
            "search_query": "nike running shoes pegasus"
        },
        {
            "name": "Fjallraven Kanken 17 Laptop Backpack",
            "sku": "FJALLRAVEN-KANKEN-17",
            "search_query": "fjallraven kanken backpack yellow"
        },
        {
            "name": "Logitech MX Master 3S Wireless Mouse",
            "sku": "LOGITECH-MX-MASTER-3S",
            "search_query": "logitech mx master mouse black"
        },
        {
            "name": "Patagonia Nano Puff Jacket",
            "sku": "PATAGONIA-NANO-PUFF",
            "search_query": "patagonia nano puff jacket outdoor"
        }
    ]
    
    # Initialize downloader
    # API key will be automatically loaded from .env.local file
    # Make sure UNSPLASH_ACCESS_KEY is set in your .env.local
    
    downloader = ProductImageDownloader(
        output_dir=r"C:\Users\Lenovo\Desktop\Workspce\vo-onelink-google\Main Shop Imp\Images2"
    )
    
    # Download 3 images per product
    downloader.download_product_images(new_products, images_per_product=3)
    
    print("\nNext steps:")
    print("1. Review downloaded images in 'product_images' folder")
    print("2. Select best primary image for each product")
    print("3. Upload to your Supabase storage")
    print("4. Update product database with image URLs") 