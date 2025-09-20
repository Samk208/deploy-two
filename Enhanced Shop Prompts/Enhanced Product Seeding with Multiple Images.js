// Enhanced seed script based on Vercel Commerce patterns
// Save as scripts/seed-enhanced-products.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Server-only and safety guards to prevent accidental client exposure or prod runs
if (typeof window !== 'undefined') {
  throw new Error('This seed script must not run in the browser. Aborting.');
}

// Optional: block in production unless explicitly allowed
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
  throw new Error('Seeding is blocked in production. Set ALLOW_PROD_SEED=true to override (not recommended).');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Create .env.local and set both values.');
}

// IMPORTANT: Never export this client from server-only modules to client bundles.
// Use anon key for non-admin reads, and service role ONLY for privileged seeding/cron.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Rich product data with multiple images per product
const productsData = [
  {
    sku: 'TECH-001',
    name: 'Premium Wireless Headphones',
    description: 'Experience crystal-clear audio with our premium wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort padding.',
    price: 29900, // $299.00
    commission: 15.0,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop'
    ],
    category: 'Electronics',
    region: ['US', 'CA', 'EU'],
    in_stock: true,
    stock_count: 50,
    active: true
  },
  {
    sku: 'TECH-002', 
    name: 'Smart Fitness Watch',
    description: 'Track your health and fitness goals with advanced monitoring, GPS tracking, water resistance, and 7-day battery life.',
    price: 24900, // $249.00
    commission: 12.0,
    images: [
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1579586337278-3f436f25d4d1?w=600&h=600&fit=crop'
    ],
    category: 'Wearables',
    region: ['US', 'CA', 'EU', 'AU'],
    in_stock: true,
    stock_count: 75,
    active: true
  },
  {
    sku: 'HOME-001',
    name: 'Minimalist Desk Lamp',
    description: 'Elegant LED desk lamp with adjustable brightness, USB charging port, and modern minimalist design perfect for any workspace.',
    price: 8900, // $89.00
    commission: 20.0,
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop'
    ],
    category: 'Home & Office',
    region: ['US', 'CA', 'EU'],
    in_stock: true,
    stock_count: 30,
    active: true
  },
  {
    sku: 'FASHION-001',
    name: 'Premium Leather Backpack',
    description: 'Handcrafted genuine leather backpack with laptop compartment, multiple pockets, and timeless design for professionals.',
    price: 15900, // $159.00
    commission: 25.0,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'
    ],
    category: 'Fashion',
    region: ['US', 'CA', 'EU'],
    in_stock: true,
    stock_count: 25,
    active: true
  },
  {
    sku: 'SPORT-001',
    name: 'Yoga Mat Premium',
    description: 'Eco-friendly yoga mat with superior grip, extra cushioning, and alignment guide marks for perfect practice sessions.',
    price: 6900, // $69.00
    commission: 18.0,
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506629905077-bda2ba771e3b?w=600&h=600&fit=crop'
    ],
    category: 'Sports & Fitness',
    region: ['US', 'CA', 'EU', 'AU'],
    in_stock: true,
    stock_count: 40,
    active: true
  },
  {
    sku: 'BEAUTY-001',
    name: 'Organic Skincare Set',
    description: 'Complete organic skincare routine with cleanser, toner, serum, and moisturizer made from natural ingredients.',
    price: 12900, // $129.00
    commission: 22.0,
    images: [
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop'
    ],
    category: 'Beauty & Personal Care',
    region: ['US', 'CA', 'EU'],
    in_stock: true,
    stock_count: 60,
    active: true
  }
];

async function seedEnhancedProducts() {
  console.log('=== Seeding Enhanced Products ===');
  
  try {
    // Get supplier user (email exists in user_admin_view, not in profiles)
    const { data: supplier, error: supplierError } = await supabase
      .from('user_admin_view')
      .select('id, role')
      .eq('email', 'supplier@example.com')
      .maybeSingle();
      
    if (supplierError || !supplier) {
      console.error('❌ Supplier not found. Run base seed script first.');
      return;
    }
    
    // Get influencer user via user_admin_view
    const { data: influencer, error: influencerError } = await supabase
      .from('user_admin_view')
      .select('id, role')
      .eq('email', 'influencer@example.com')
      .maybeSingle();
      
    if (influencerError || !influencer) {
      console.error('❌ Influencer not found. Run base seed script first.');
      return;
    }
    
    // SAFETY CHECKS: Prevent accidental production data loss
    // This script is for DEVELOPMENT/TESTING ONLY
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEEDING !== 'true') {
      console.error('❌ SAFETY: Refusing to run in production environment');
      console.error('   Set ALLOW_PRODUCTION_SEEDING=true to override (NOT RECOMMENDED)');
      return;
    }
    
    if (process.env.ALLOW_SEEDING !== 'true') {
      console.error('❌ SAFETY: Seeding not explicitly enabled');
      console.error('   Set ALLOW_SEEDING=true to enable data seeding');
      return;
    }
    
    console.log('⚠️  AUDIT: Data seeding initiated by:', process.env.USER || process.env.USERNAME || 'unknown');
    console.log('⚠️  AUDIT: Environment:', process.env.NODE_ENV || 'development');
    console.log('⚠️  AUDIT: Timestamp:', new Date().toISOString());
    
    // Use transaction for atomic operations with rollback capability
    const { data: txData, error: transactionError } = await supabase.rpc('begin_transaction');

    // Immediately handle transaction start failures or unexpected response
    if (transactionError || !txData) {
      console.error('❌ Failed to begin transaction:', transactionError || 'No transaction data returned');
      // Attempt rollback/cleanup if the RPC partially opened a txn in database session
      try {
        await supabase.rpc('rollback_transaction');
        console.log('✅ Performed safety rollback after failed transaction start');
      } catch (rbErr) {
        console.warn('⚠️  Rollback attempt after failed begin_transaction did not complete:', rbErr);
      }
      // Abort further DB operations
      throw transactionError || new Error('begin_transaction returned no data');
    }

    try {
      // Clear existing products with safety constraints
      // Only delete test/development data (products created in last 24 hours or with test SKUs)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      console.log('🗑️  Clearing existing test products...');
      
      // Delete influencer_shop_products first (foreign key constraint)
      const { error: deleteLinksError } = await supabase
        .from('influencer_shop_products')
        .delete()
        .or(`created_at.gte.${twentyFourHoursAgo},products.sku.like.SEED-%,products.sku.like.TEST-%`);
      
      if (deleteLinksError) throw deleteLinksError;
      
      // Delete products with safety constraints
      const { error: deleteProductsError } = await supabase
        .from('products')
        .delete()
        .or(`created_at.gte.${twentyFourHoursAgo},sku.like.SEED-%,sku.like.TEST-%`);
      
      if (deleteProductsError) throw deleteProductsError;
    
    console.log('✅ Cleared existing products');
    
    // Insert enhanced products (convert cents -> dollars for DECIMAL(10,2))
    for (const productData of productsData) {
      const toDollars = (cents) => Number(((Number(cents) || 0) / 100).toFixed(2))
      const payload = {
        sku: productData.sku,
        title: productData.name,
        description: productData.description,
        price: toDollars(productData.price),
        original_price: productData.originalCents ? toDollars(productData.originalCents) : undefined,
        commission: productData.commission,
        images: productData.images,
        category: productData.category,
        region: productData.region,
        in_stock: productData.in_stock,
        stock_count: productData.stock_count,
        active: productData.active,
        supplier_id: supplier.id,
      }
      const { error: productError } = await supabase
        .from('products')
        .insert(payload);
        
      if (productError) {
        console.error(`❌ Error creating product ${productData.sku}:`, productError);
      } else {
        console.log(`✅ Created product: ${productData.name}`);
      }
    }
    
    // Link products to influencer shop
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .eq('supplier_id', supplier.id);
      
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    // Link first 3 products to influencer shop with custom pricing
    const productsToLink = products.slice(0, 3);
    
    for (const [index, product] of productsToLink.entries()) {
      const { error: linkError } = await supabase
        .from('influencer_shop_products')
        .insert({
          influencer_id: influencer.id,
          product_id: product.id,
          // Use dollars (DECIMAL) rather than cents
          sale_price: index === 0 ? 279.00 : null,
          custom_title: index === 1 ? `${product.title} - Influencer Special` : null,
          is_featured: index === 0
        });
        
      if (linkError) {
        console.error(`❌ Error linking product ${product.title}:`, linkError);
      } else {
        console.log(`✅ Linked product to influencer shop: ${product.title}`);
      }
    }
    
    console.log('\n✅ Enhanced seeding complete!');
    console.log(`📊 Created ${productsData.length} products with multiple images`);
    console.log(`🔗 Linked ${productsToLink.length} products to influencer shop`);
    console.log('\n🌐 Test URLs:');
    console.log('  - Main catalog: http://localhost:3000/shop');
    console.log('  - Influencer shop: http://localhost:3000/shop/influencer-shop');
    console.log('  - Main influencer shop: http://localhost:3000/shop/main-influencer-shop');
    
    // Commit transaction
    await supabase.rpc('commit_transaction');
    console.log('✅ Transaction committed successfully');
    
  } catch (transactionError) {
    console.error('❌ AUDIT: Seeding transaction failed:', transactionError);
    console.error('⚠️  AUDIT: Rolling back changes...');
    
    // Rollback transaction on error
    try {
      await supabase.rpc('rollback_transaction');
      console.log('✅ Transaction rolled back successfully');
    } catch (rollbackError) {
      console.error('❌ CRITICAL: Rollback failed:', rollbackError);
    }
    
    throw transactionError;
  }
  
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('⚠️  AUDIT: Script execution failed at:', new Date().toISOString());
  }
}

seedEnhancedProducts();