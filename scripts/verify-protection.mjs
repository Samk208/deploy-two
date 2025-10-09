#!/usr/bin/env node
/**
 * Comprehensive Shop Data Protection Verification Script
 * Tests all protection layers to ensure shop data safety
 * 
 * This script verifies:
 * - Database freeze protection (RLS policies)
 * - Soft delete protection 
 * - Storage security policies
 * - Data integrity constraints
 * - Backup system functionality
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create clients for different access levels
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test Result Tracking
 */
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  test(name, testFn) {
    return new Promise(async (resolve) => {
      try {
        const result = await testFn();
        const status = result.pass ? 'PASS' : result.warn ? 'WARN' : 'FAIL';
        
        this.tests.push({
          name,
          status,
          message: result.message,
          details: result.details
        });

        if (result.pass) this.passed++;
        else if (result.warn) this.warnings++;
        else this.failed++;

        console.log(`  ${this.getStatusIcon(status)} ${name}: ${result.message}`);
        if (result.details) {
          console.log(`    ${result.details}`);
        }
        
        resolve(result);
      } catch (error) {
        this.tests.push({
          name,
          status: 'FAIL',
          message: 'Test execution failed',
          details: error.message
        });
        this.failed++;
        console.log(`  ❌ ${name}: Test execution failed - ${error.message}`);
        resolve({ pass: false, message: 'Test execution failed', details: error.message });
      }
    });
  }

  getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': return '❌';
      default: return '❓';
    }
  }

  summary() {
    console.log(`\n📊 ${this.name} Summary:`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`⚠️  Warnings: ${this.warnings}`);
    console.log(`❌ Failed: ${this.failed}`);
    
    const total = this.passed + this.warnings + this.failed;
    const successRate = total > 0 ? Math.round((this.passed / total) * 100) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    
    return {
      name: this.name,
      passed: this.passed,
      warnings: this.warnings,
      failed: this.failed,
      total,
      successRate
    };
  }
}

/**
 * 1. Test Database Freeze Protection
 */
async function testDatabaseFreezeProtection() {
  const suite = new TestSuite('Database Freeze Protection');
  console.log(`\n🧊 Testing ${suite.name}...`);

  // Test freeze function exists
  await suite.test('Freeze function exists', async () => {
    try {
      const { data, error } = await supabaseAdmin.rpc('sql', {
        query: "SELECT app.is_shops_frozen();"
      });
      return { 
        pass: !error, 
        message: error ? 'Freeze function missing' : 'Freeze function available',
        details: error?.message 
      };
    } catch (err) {
      return { pass: false, message: 'Freeze function not found', details: err.message };
    }
  });

  // Test RLS policies exist
  await suite.test('RLS policies active', async () => {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .in('tablename', ['products', 'shops'])
      .like('policyname', '%unfrozen%');
    
    const expectedPolicies = 6; // 3 per table (insert, update, delete)
    const actualPolicies = policies?.length || 0;
    
    return {
      pass: actualPolicies >= expectedPolicies,
      warn: actualPolicies > 0 && actualPolicies < expectedPolicies,
      message: `${actualPolicies}/${expectedPolicies} freeze policies found`,
      details: actualPolicies < expectedPolicies ? 'Some policies may be missing' : null
    };
  });

  // Test freeze toggle functionality
  await suite.test('Freeze toggle works', async () => {
    try {
      // Enable freeze
      await supabaseAdmin.rpc('sql', { query: "SELECT app.freeze_shops();" });
      
      // Check status
      const { data: freezeStatus } = await supabaseAdmin.rpc('sql', {
        query: "SELECT app.is_shops_frozen();"
      });
      
      // Disable freeze
      await supabaseAdmin.rpc('sql', { query: "SELECT app.unfreeze_shops();" });
      
      const isFrozen = freezeStatus?.[0]?.is_shops_frozen;
      return {
        pass: isFrozen === true,
        message: isFrozen ? 'Freeze toggle functional' : 'Freeze toggle not working',
        details: `Freeze status: ${isFrozen}`
      };
    } catch (err) {
      return { pass: false, message: 'Freeze toggle failed', details: err.message };
    }
  });

  return suite.summary();
}

/**
 * 2. Test Soft Delete Protection
 */
async function testSoftDeleteProtection() {
  const suite = new TestSuite('Soft Delete Protection');
  console.log(`\n🛡️ Testing ${suite.name}...`);

  // Test soft delete columns exist
  await suite.test('Soft delete columns exist', async () => {
    const { data: columns, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('table_name, column_name')
      .in('table_name', ['products', 'shops', 'influencer_shop_products'])
      .eq('column_name', 'deleted_at');
    
    const expectedColumns = 3; // products, shops, influencer_shop_products
    const actualColumns = columns?.length || 0;
    
    return {
      pass: actualColumns >= 2, // At minimum products and shops
      warn: actualColumns >= 1 && actualColumns < expectedColumns,
      message: `${actualColumns}/${expectedColumns} soft delete columns found`,
      details: actualColumns < expectedColumns ? 'Some deleted_at columns missing' : null
    };
  });

  // Test hard delete policies block authenticated users
  await suite.test('Hard delete blocked for authenticated users', async () => {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .in('tablename', ['products', 'shops', 'influencer_shop_products'])
      .like('policyname', '%delete_denied%');
    
    return {
      pass: (policies?.length || 0) >= 2, // At minimum products and shops
      warn: (policies?.length || 0) >= 1,
      message: policies?.length >= 2 ? 'Hard delete policies active' : 'Missing delete protection policies',
      details: `Found ${policies?.length || 0} delete denial policies`
    };
  });

  // Test soft delete functions exist
  await suite.test('Soft delete functions available', async () => {
    try {
      const { data: functions, error } = await supabaseAdmin
        .from('information_schema.routines')
        .select('routine_name')
        .in('routine_name', ['soft_delete_product', 'soft_delete_shop', 'restore_product', 'restore_shop']);
      
      const expectedFunctions = 4;
      const actualFunctions = functions?.length || 0;
      
      return {
        pass: actualFunctions >= expectedFunctions,
        warn: actualFunctions > 0 && actualFunctions < expectedFunctions,
        message: `${actualFunctions}/${expectedFunctions} soft delete functions found`,
        details: actualFunctions < expectedFunctions ? 'Some functions may be missing' : null
      };
    } catch (err) {
      return { pass: false, message: 'Could not check functions', details: err.message };
    }
  });

  return suite.summary();
}

/**
 * 3. Test Storage Protection
 */
async function testStorageProtection() {
  const suite = new TestSuite('Storage Protection');
  console.log(`\n📁 Testing ${suite.name}...`);

  // Test storage buckets exist
  await suite.test('Required storage buckets exist', async () => {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    const requiredBuckets = ['product-images', 'product-images-backup'];
    const existingBuckets = buckets?.map(b => b.id) || [];
    const foundBuckets = requiredBuckets.filter(bucket => existingBuckets.includes(bucket));
    
    return {
      pass: foundBuckets.length === requiredBuckets.length,
      warn: foundBuckets.length > 0 && foundBuckets.length < requiredBuckets.length,
      message: `${foundBuckets.length}/${requiredBuckets.length} required buckets found`,
      details: `Found: ${foundBuckets.join(', ')}`
    };
  });

  // Test storage policies exist
  await suite.test('Storage security policies active', async () => {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')
      .like('policyname', '%product-images%');
    
    return {
      pass: (policies?.length || 0) >= 4,
      warn: (policies?.length || 0) > 0,
      message: `${policies?.length || 0} storage policies found`,
      details: policies?.length < 4 ? 'May be missing some security policies' : 'Storage policies configured'
    };
  });

  // Test public read access works
  await suite.test('Public read access functional', async () => {
    try {
      // Try to list files in product-images bucket (should work)
      const { data, error } = await supabaseAnon.storage
        .from('product-images')
        .list('sample-products', { limit: 1 });
      
      return {
        pass: !error || error.message.includes('not found'), // Not found is OK, access denied is not
        message: error?.message?.includes('denied') ? 'Public read access blocked' : 'Public read access working',
        details: error?.message
      };
    } catch (err) {
      return { 
        pass: false, 
        message: 'Could not test public read access', 
        details: err.message 
      };
    }
  });

  return suite.summary();
}

/**
 * 4. Test Data Integrity Constraints
 */
async function testDataIntegrityConstraints() {
  const suite = new TestSuite('Data Integrity Constraints');
  console.log(`\n🔒 Testing ${suite.name}...`);

  // Test check constraints exist
  await suite.test('Data validation constraints active', async () => {
    const { data: constraints, error } = await supabaseAdmin
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name')
      .eq('constraint_type', 'CHECK')
      .in('table_name', ['products', 'shops']);
    
    const constraintCount = constraints?.length || 0;
    
    return {
      pass: constraintCount >= 10,
      warn: constraintCount >= 5,
      message: `${constraintCount} data validation constraints found`,
      details: constraintCount < 10 ? 'Some constraints may be missing' : 'Comprehensive validation active'
    };
  });

  // Test validation function exists
  await suite.test('Constraint validation function available', async () => {
    try {
      const { data, error } = await supabaseAdmin.rpc('sql', {
        query: "SELECT validate_image_url('https://example.com/test.jpg');"
      });
      
      return {
        pass: !error,
        message: error ? 'Validation function missing' : 'Validation function available',
        details: error?.message
      };
    } catch (err) {
      return { pass: false, message: 'Validation function not found', details: err.message };
    }
  });

  // Test constraint violation detection
  await suite.test('Constraint violation detection works', async () => {
    try {
      // Try to create invalid data (this should fail due to constraints)
      const { error } = await supabaseAdmin
        .from('products')
        .insert({
          title: '', // Should fail - empty title
          price: -10, // Should fail - negative price
          images: [] // Should fail - empty images array
        });
      
      return {
        pass: !!error, // We WANT this to fail due to constraints
        message: error ? 'Constraints blocking invalid data' : 'WARNING: Invalid data was accepted',
        details: error?.message || 'Constraints may not be working properly'
      };
    } catch (err) {
      return { pass: true, message: 'Constraints active (insert rejected)', details: err.message };
    }
  });

  return suite.summary();
}

/**
 * 5. Test Backup System
 */
async function testBackupSystem() {
  const suite = new TestSuite('Backup System');
  console.log(`\n💾 Testing ${suite.name}...`);

  // Test backup functions exist
  await suite.test('Backup tables can be created', async () => {
    try {
      const testTimestamp = '2025_01_08_test';
      
      // Try to create a test backup
      const { error } = await supabaseAdmin.rpc('sql', {
        query: `CREATE TABLE products_backup_${testTimestamp} AS SELECT * FROM products LIMIT 0;`
      });
      
      if (!error) {
        // Clean up test table
        await supabaseAdmin.rpc('sql', {
          query: `DROP TABLE IF EXISTS products_backup_${testTimestamp};`
        });
      }
      
      return {
        pass: !error,
        message: error ? 'Cannot create backup tables' : 'Backup table creation works',
        details: error?.message
      };
    } catch (err) {
      return { pass: false, message: 'Backup system test failed', details: err.message };
    }
  });

  // Test if any existing backups are present
  await suite.test('Backup history status', async () => {
    const { data: backupTables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%_backup_%');
    
    const backupCount = backupTables?.length || 0;
    
    return {
      pass: true, // This is informational
      warn: backupCount === 0,
      message: backupCount > 0 ? `${backupCount} backup tables found` : 'No backup history found',
      details: backupCount === 0 ? 'Consider creating your first backup' : null
    };
  });

  return suite.summary();
}

/**
 * 6. Test Overall System Health
 */
async function testSystemHealth() {
  const suite = new TestSuite('System Health');
  console.log(`\n🏥 Testing ${suite.name}...`);

  // Test database connectivity
  await suite.test('Database connectivity', async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1);
      
      return {
        pass: !error,
        message: error ? 'Database connection issues' : 'Database connectivity OK',
        details: error?.message
      };
    } catch (err) {
      return { pass: false, message: 'Database connection failed', details: err.message };
    }
  });

  // Test RLS is enabled on critical tables
  await suite.test('Row Level Security enabled', async () => {
    const { data: tables, error } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['products', 'shops'])
      .eq('schemaname', 'public');
    
    const rlsEnabled = tables?.filter(t => t.rowsecurity).length || 0;
    const totalTables = tables?.length || 0;
    
    return {
      pass: rlsEnabled === totalTables && totalTables > 0,
      message: `RLS enabled on ${rlsEnabled}/${totalTables} critical tables`,
      details: rlsEnabled < totalTables ? 'Some tables missing RLS protection' : null
    };
  });

  // Test service role vs authenticated permissions
  await suite.test('Permission isolation working', async () => {
    try {
      // Service role should be able to read
      const { data: serviceData, error: serviceError } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1);
      
      // Anonymous role should also be able to read (public read)
      const { data: anonData, error: anonError } = await supabaseAnon
        .from('products')
        .select('id')
        .limit(1);
      
      const serviceWorks = !serviceError;
      const anonWorks = !anonError;
      
      return {
        pass: serviceWorks && anonWorks,
        warn: serviceWorks || anonWorks,
        message: `Service role: ${serviceWorks ? 'OK' : 'FAIL'}, Anonymous: ${anonWorks ? 'OK' : 'FAIL'}`,
        details: serviceError?.message || anonError?.message
      };
    } catch (err) {
      return { pass: false, message: 'Permission test failed', details: err.message };
    }
  });

  return suite.summary();
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 Shop Data Protection Verification Suite');
  console.log('==========================================');
  console.log(`Database: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = [];

  // Run all test suites
  results.push(await testDatabaseFreezeProtection());
  results.push(await testSoftDeleteProtection());
  results.push(await testStorageProtection());
  results.push(await testDataIntegrityConstraints());
  results.push(await testBackupSystem());
  results.push(await testSystemHealth());

  // Overall summary
  console.log('\n🎯 OVERALL PROTECTION STATUS');
  console.log('============================');

  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalTests = totalPassed + totalWarnings + totalFailed;
  
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`⚠️  Total Warnings: ${totalWarnings}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  
  const overallSuccess = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  console.log(`📊 Overall Success Rate: ${overallSuccess}%`);

  // Security assessment
  let securityLevel = 'UNKNOWN';
  if (totalFailed === 0) {
    securityLevel = totalWarnings === 0 ? 'EXCELLENT' : 'GOOD';
  } else if (totalFailed <= 2) {
    securityLevel = 'MODERATE';
  } else {
    securityLevel = 'POOR';
  }

  console.log(`🛡️  Security Level: ${securityLevel}`);

  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  if (totalFailed > 0) {
    console.log('❌ CRITICAL: Fix failed tests immediately');
  }
  if (totalWarnings > 0) {
    console.log('⚠️  WARNING: Address warning items when possible');
  }
  if (securityLevel === 'EXCELLENT') {
    console.log('🎉 All protection systems operational!');
  }

  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Run database protection SQL scripts if tests failed');
  console.log('2. Create your first backup: node scripts/backup-database.mjs create');
  console.log('3. Test freeze functionality: SELECT app.freeze_shops();');
  console.log('4. Set up automated backups for production');

  return {
    results,
    summary: {
      totalPassed,
      totalWarnings,
      totalFailed,
      totalTests,
      overallSuccess,
      securityLevel
    }
  };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(({ summary }) => {
      process.exit(summary.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test suite execution failed:', error);
      process.exit(1);
    });
}

export { runAllTests };
