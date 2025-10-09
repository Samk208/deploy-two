#!/usr/bin/env node
/**
 * Test script to verify SHOPS_FREEZE functionality
 * Tests that write endpoints return 423 when SHOPS_FREEZE=true
 * and 200/204 when SHOPS_FREEZE=false, while reads continue to work
 */

import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Test endpoints and their expected behavior
const TEST_CASES = [
  // Read endpoints - should always work (200/404)
  {
    method: 'GET',
    endpoint: '/api/products',
    description: 'Products listing (read)',
    expectWorksDuringFreeze: true
  },
  {
    method: 'GET', 
    endpoint: '/api/shop/influencer-alex',
    description: 'Shop data (read)',
    expectWorksDuringFreeze: true
  },
  {
    method: 'GET',
    endpoint: '/api/main-shop/feed',
    description: 'Main shop feed (read)',
    expectWorksDuringFreeze: true
  },
  
  // Write endpoints - should be blocked during freeze (423)
  {
    method: 'POST',
    endpoint: '/api/products',
    description: 'Create product (write)',
    expectWorksDuringFreeze: false,
    body: { title: 'Test Product', price: 10 }
  },
  {
    method: 'POST',
    endpoint: '/api/influencer/shop',
    description: 'Add product to shop (curation write)',
    expectWorksDuringFreeze: false,
    body: { productId: '123e4567-e89b-12d3-a456-426614174000' }
  },
  {
    method: 'PUT',
    endpoint: '/api/products/123e4567-e89b-12d3-a456-426614174000',
    description: 'Update product (write)',
    expectWorksDuringFreeze: false,
    body: { title: 'Updated Product' }
  },
  {
    method: 'DELETE',
    endpoint: '/api/influencer/shop/123e4567-e89b-12d3-a456-426614174000',
    description: 'Remove product from shop (curation write)', 
    expectWorksDuringFreeze: false
  }
];

/**
 * Make HTTP request to test endpoint
 */
async function makeRequest(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    return {
      status: response.status,
      ok: response.ok,
      data: await response.json().catch(() => null)
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Test with SHOPS_FREEZE enabled
 */
async function testWithFreeze() {
  console.log('\n🧊 Testing with SHOPS_FREEZE=true...\n');
  
  // Set environment variable for this test
  process.env.SHOPS_FREEZE = 'true';
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await makeRequest(testCase.method, testCase.endpoint, testCase.body);
    const expectedStatus = testCase.expectWorksDuringFreeze ? 
      (result.status >= 200 && result.status < 500) : // Read operations can return 200, 404, etc.
      423; // Write operations should return 423
    
    const passed = testCase.expectWorksDuringFreeze ? 
      (result.status !== 423) : // Reads should NOT be blocked
      (result.status === 423);   // Writes SHOULD be blocked
    
    console.log(`${passed ? '✅' : '❌'} ${testCase.method} ${testCase.endpoint}`);
    console.log(`   ${testCase.description}`);
    console.log(`   Expected: ${testCase.expectWorksDuringFreeze ? 'Allow' : 'Block (423)'}, Got: ${result.status}`);
    
    if (result.status === 423 && result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    
    results.push({ ...testCase, passed, actualStatus: result.status });
    console.log('');
  }
  
  return results;
}

/**
 * Test with SHOPS_FREEZE disabled
 */
async function testWithoutFreeze() {
  console.log('\n🔓 Testing with SHOPS_FREEZE=false...\n');
  
  // Set environment variable for this test
  process.env.SHOPS_FREEZE = 'false';
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await makeRequest(testCase.method, testCase.endpoint, testCase.body);
    
    // When freeze is off, no endpoint should return 423 due to freeze
    const passed = result.status !== 423;
    
    console.log(`${passed ? '✅' : '❌'} ${testCase.method} ${testCase.endpoint}`);
    console.log(`   ${testCase.description}`);
    console.log(`   Expected: No 423 blocks, Got: ${result.status}`);
    
    // Note: We expect various other status codes (401, 403, 404, etc.) based on auth/validation
    if (result.status >= 400) {
      console.log(`   Note: ${result.status} is expected for auth/validation reasons, not freeze`);
    }
    
    results.push({ ...testCase, passed, actualStatus: result.status });
    console.log('');
  }
  
  return results;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 SHOPS_FREEZE Test Suite');
  console.log('===========================');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Test with freeze enabled
  const freezeResults = await testWithFreeze();
  
  // Test with freeze disabled  
  const unfreezeResults = await testWithoutFreeze();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const freezeTestsPassed = freezeResults.filter(r => r.passed).length;
  const unfreezeTestsPassed = unfreezeResults.filter(r => r.passed).length;
  
  console.log(`Freeze Tests: ${freezeTestsPassed}/${freezeResults.length} passed`);
  console.log(`Unfreeze Tests: ${unfreezeTestsPassed}/${unfreezeResults.length} passed`);
  
  const allPassed = freezeTestsPassed === freezeResults.length && 
                   unfreezeTestsPassed === unfreezeResults.length;
  
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);
  
  if (!allPassed) {
    console.log('\nFailed tests:');
    [...freezeResults, ...unfreezeResults]
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`- ${r.method} ${r.endpoint}: expected ${r.expectWorksDuringFreeze ? 'allow' : 'block'}, got ${r.actualStatus}`);
      });
  }
  
  return allPassed;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests };
