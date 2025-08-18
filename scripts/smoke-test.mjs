#!/usr/bin/env node
// SPDX-License-Identifier: (MIT OR MPL-2.0)

/**
 * Smoke test script for ProofPoll Lite API endpoints
 * Tests basic functionality without requiring external credentials
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

async function makeRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    return {
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function runSmokeTests() {
  console.log(`🧪 Running smoke tests against ${BASE_URL}\n`);
  
  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  const health = await makeRequest('GET', '/api/health');
  if (health.ok && (health.data.status === 'ok' || health.data.status === 'healthy')) {
    console.log('   ✅ Health check passed');
    passed++;
  } else {
    console.log('   ❌ Health check failed:', health);
    failed++;
  }

  // Test 2: Create poll
  console.log('\n2. Testing poll creation...');
  const createPoll = await makeRequest('POST', '/api/polls', {
    question: 'Test poll question?',
    options: ['Option A', 'Option B'],
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
  });
  
  if (createPoll.ok && createPoll.data.id) {
    console.log('   ✅ Poll creation passed');
    console.log(`   📋 Poll ID: ${createPoll.data.id}`);
    passed++;
    
    const pollId = createPoll.data.id;
    
    // Test 3: Get poll
    console.log('\n3. Testing poll retrieval...');
    const getPoll = await makeRequest('GET', `/api/polls/${pollId}`);
    if (getPoll.ok && getPoll.data.question) {
      console.log('   ✅ Poll retrieval passed');
      passed++;
    } else {
      console.log('   ❌ Poll retrieval failed:', getPoll);
      failed++;
    }
    
    // Test 4: Vote on poll
    console.log('\n4. Testing vote submission...');
    const vote = await makeRequest('POST', `/api/polls/${pollId}/vote`, {
      optionId: getPoll.data.options[0].id,
      source: 'slack',
      userId: 'test-user-' + Date.now()
    });
    
    if (vote.ok && (vote.data.ok || vote.data.success)) {
      console.log('   ✅ Vote submission passed');
      console.log(`   🔐 Proof hash: ${vote.data.proofHash?.substring(0, 16)}...`);
      console.log(`   👤 Voter proof ID: ${vote.data.voterProofId?.substring(0, 16)}...`);
      passed++;
    } else {
      console.log('   ❌ Vote submission failed:', vote);
      failed++;
    }
    
  } else {
    console.log('   ❌ Poll creation failed:', createPoll);
    failed++;
  }

  // Summary
  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed');
    process.exit(1);
  }
}

runSmokeTests().catch(error => {
  console.error('Error running smoke tests:', error);
  process.exit(1);
});