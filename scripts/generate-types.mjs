#!/usr/bin/env node
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

console.log('🔧 Generating Supabase types...');

try {
  // Generate types using Supabase CLI
  const output = execSync(
    `npx supabase gen types typescript --project-id ${supabaseUrl.split('.')[0].split('//')[1]} --schema public`,
    { encoding: 'utf-8' }
  );
  
  // Write to the types file
  writeFileSync('./lib/supabase/database.types.ts', output);
  
  console.log('✅ Types generated successfully at lib/supabase/database.types.ts');
  console.log('📝 Remember to update your imports to use the new types');
} catch (error) {
  console.error('❌ Failed to generate types:', error.message);
  console.log('\n💡 Alternative: Generate types from the Supabase Dashboard:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Click "Generate Types" and select TypeScript');
  console.log('4. Copy the generated types to lib/supabase/database.types.ts');
}
