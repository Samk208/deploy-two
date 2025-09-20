# One-Link Database Schema

This document outlines the Supabase database schema for the One-Link platform.

## Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('supplier', 'influencer', 'customer', 'admin')),
  avatar VARCHAR,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10,2) CHECK (original_price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  category VARCHAR NOT NULL,
  region TEXT[] NOT NULL DEFAULT '{}',
  in_stock BOOLEAN DEFAULT TRUE,
  stock_count INTEGER DEFAULT 0 CHECK (stock_count >= 0),
  commission DECIMAL(5,2) NOT NULL CHECK (commission >= 0 AND commission <= 95),
  active BOOLEAN DEFAULT TRUE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(supplier_id, sku)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (active = TRUE);
CREATE POLICY "Suppliers can manage own products" ON products FOR ALL USING (
  supplier_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_sku ON products(sku);
```

### shops
```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  logo VARCHAR,
  banner VARCHAR,
  products UUID[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active shops" ON shops FOR SELECT USING (active = TRUE);
CREATE POLICY "Influencers can manage own shops" ON shops FOR ALL USING (
  influencer_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX idx_shops_influencer_id ON shops(influencer_id);
CREATE INDEX idx_shops_handle ON shops(handle);
CREATE INDEX idx_shops_active ON shops(active);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  payment_method VARCHAR NOT NULL,
  stripe_payment_intent_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### commissions
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 95),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own commissions" ON commissions FOR SELECT USING (
  influencer_id = auth.uid() OR 
  supplier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX idx_commissions_order_id ON commissions(order_id);
CREATE INDEX idx_commissions_influencer_id ON commissions(influencer_id);
CREATE INDEX idx_commissions_supplier_id ON commissions(supplier_id);
CREATE INDEX idx_commissions_status ON commissions(status);
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each table creation script above in order
4. Verify that Row Level Security (RLS) is enabled for all tables
5. Test the policies by creating test data

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
