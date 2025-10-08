import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync, readdirSync, statSync } from 'fs'
import { extname, join } from 'path'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadImagesFromFolder(folderPath) {
  console.log(`📁 Scanning folder: ${folderPath}`)
  
  try {
    let imageFiles = []
    
    // Recursive function to scan directories
    function scanDirectory(currentPath, category = 'general', subcategory = '') {
      const files = readdirSync(currentPath)
      
      for (const file of files) {
        const fullPath = join(currentPath, file)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          // If we're at the top level, this is the category
          if (currentPath === folderPath) {
            scanDirectory(fullPath, file)
          } else {
            // This is a subcategory or product folder
            scanDirectory(fullPath, category, file)
          }
        } else {
          // Check if it's an image file
          const ext = extname(file).toLowerCase()
          if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
            const productName = subcategory || category
            imageFiles.push({ 
              name: file, 
              path: fullPath,
              category: category,
              product: productName,
              storageName: `${productName}-${file}` // Unique filename
            })
          }
        }
      }
    }
    
    scanDirectory(folderPath)
    
    console.log(`📸 Found ${imageFiles.length} image files across all directories`)
    
    if (imageFiles.length === 0) {
      console.log('No image files found. Supported formats: .jpg, .jpeg, .png, .webp, .gif')
      return
    }
    
    const uploadedUrls = []
    
    for (const fileInfo of imageFiles) {
      const fileBuffer = readFileSync(fileInfo.path)
      const fileStats = statSync(fileInfo.path)
      
      // Generate storage path using category and unique filename
      const storagePath = `sample-products/${fileInfo.category}/${fileInfo.storageName}`
      
      console.log(`⬆️  Uploading: ${fileInfo.product}/${fileInfo.name} (${(fileStats.size / 1024).toFixed(1)}KB)`)
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(storagePath, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${extname(fileInfo.name).slice(1) === 'jpg' ? 'jpeg' : extname(fileInfo.name).slice(1)}`
        })
      
      if (error) {
        console.error(`❌ Failed to upload ${fileInfo.name}:`, error.message)
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(storagePath)
        
        console.log(`✅ Uploaded: ${fileInfo.product}/${fileInfo.name}`)
        console.log(`   URL: ${publicUrl}`)
        uploadedUrls.push({ 
          filename: `${fileInfo.product}/${fileInfo.name}`, 
          url: publicUrl, 
          category: fileInfo.category,
          product: fileInfo.product
        })
      }
    }
    
    console.log(`\n🎉 Upload complete! ${uploadedUrls.length} images uploaded successfully.`)
    console.log('\n📋 URLs organized by category:')
    
    // Group by product
    const byProduct = uploadedUrls.reduce((acc, { filename, url, category, product }) => {
      if (!acc[product]) acc[product] = []
      acc[product].push({ filename, url, category })
      return acc
    }, {})
    
    Object.entries(byProduct).forEach(([product, files]) => {
      console.log(`\n-- ${product.toUpperCase()} PRODUCT:`);
      console.log(`-- Category: ${files[0]?.category || 'unknown'}`);
      files.forEach(({ filename, url }) => {
        console.log(`'${url}',`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error uploading images:', error.message)
    if (error.code === 'ENOENT') {
      console.error(`The folder "${folderPath}" does not exist.`)
    }
  }
}

// Get folder path from command line or use default from memory
const folderPath = process.argv[2] || 'Main Shop Imp/images'
uploadImagesFromFolder(folderPath)