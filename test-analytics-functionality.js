/**
 * Real Functionality Testing Script for Analytics Components
 * 
 * This script tests the actual functionality of analytics components by making API requests
 * and validating the responses and functionality of the components. Run this script using Node.js.
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';

// Configure base URL depending on environment
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// Helper to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Helper to validate objects have required properties
function validateObjectProperties(obj, requiredProps) {
  const missing = requiredProps.filter(prop => !(prop in obj));
  if (missing.length > 0) {
    return {
      valid: false,
      missing
    };
  }
  return { 
    valid: true,
    missing: []
  };
}

// Test the overall analytics API endpoint
async function testOverallAnalytics() {
  console.log("Testing Overall Analytics API...");
  try {
    const data = await apiRequest('/api/analytics/overall');
    
    // Validate required properties
    const requiredProps = [
      'testCount', 'attemptCount', 'totalQuestions',
      'totalCorrect', 'accuracy', 'avgTimeSeconds'
    ];
    
    const validation = validateObjectProperties(data, requiredProps);
    
    if (validation.valid) {
      console.log("✅ Overall Analytics API returned valid data");
      console.log(`   Tests: ${data.testCount}, Attempts: ${data.attemptCount}, Questions: ${data.totalQuestions}`);
      console.log(`   Accuracy: ${data.accuracy.toFixed(2)}%, Average Time: ${data.avgTimeSeconds.toFixed(2)}s`);
      return true;
    } else {
      console.log("❌ Overall Analytics API data is missing properties:", validation.missing);
      return false;
    }
  } catch (error) {
    console.error("❌ Overall Analytics API test failed:", error.message);
    return false;
  }
}

// Test the test-specific analytics API endpoint
async function testTestAnalytics() {
  console.log("Testing Test-specific Analytics API...");
  try {
    // First, get a list of all attempts
    const tests = await apiRequest('/api/tests');
    
    if (tests.length === 0) {
      console.log("⚠️ No tests available to test analytics");
      return true; // Not a failure, just no data
    }
    
    // Find first test with attempts
    let testWithAttempts = null;
    let attemptId = null;
    
    for (const test of tests) {
      const attempts = await apiRequest(`/api/tests/${test.id}/attempts`);
      if (attempts.length > 0) {
        testWithAttempts = test;
        attemptId = attempts[0].id;
        break;
      }
    }
    
    if (!testWithAttempts || !attemptId) {
      console.log("⚠️ No tests with attempts available to test analytics");
      return true; // Not a failure, just no data
    }
    
    // Get analytics for the attempt
    const analytics = await apiRequest(`/api/analytics/test/${attemptId}`);
    
    // Validate required properties
    const requiredProps = [
      'testId', 'attemptId', 'title', 'date',
      'overallStats', 'subjectStats'
    ];
    
    const validation = validateObjectProperties(analytics, requiredProps);
    
    if (validation.valid) {
      console.log("✅ Test Analytics API returned valid data");
      console.log(`   Test: "${analytics.title}", Date: ${new Date(analytics.date).toLocaleDateString()}`);
      console.log(`   Overall Accuracy: ${analytics.overallStats.accuracy.toFixed(2)}%`);
      console.log(`   Subjects analyzed: ${analytics.subjectStats.length}`);
      return true;
    } else {
      console.log("❌ Test Analytics API data is missing properties:", validation.missing);
      return false;
    }
  } catch (error) {
    console.error("❌ Test Analytics API test failed:", error.message);
    return false;
  }
}

// Test tag functionality
async function testTagFunctionality() {
  console.log("Testing Tag Functionality...");
  try {
    const tags = await apiRequest('/api/tags');
    
    if (Array.isArray(tags)) {
      console.log(`✅ Tags API returned ${tags.length} tags`);
      if (tags.length > 0) {
        console.log(`   Sample tags: ${tags.slice(0, 3).join(", ")}${tags.length > 3 ? "..." : ""}`);
      }
      return true;
    } else {
      console.log("❌ Tags API did not return an array");
      return false;
    }
  } catch (error) {
    console.error("❌ Tags API test failed:", error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("========== ANALYTICS FUNCTIONALITY TESTS ==========");
  console.log(`Testing against API at: ${BASE_URL}`);
  console.log("=================================================\n");
  
  // Define all tests
  const tests = [
    { name: "Overall Analytics API", fn: testOverallAnalytics },
    { name: "Test Analytics API", fn: testTestAnalytics },
    { name: "Tag Functionality", fn: testTagFunctionality }
  ];
  
  // Run tests and track results
  const results = [];
  
  for (const test of tests) {
    console.log(`\n>> Running test: ${test.name}`);
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`Unhandled error in ${test.name}:`, error);
      results.push({ name: test.name, passed: false, error });
    }
  }
  
  // Print summary
  console.log("\n\n========== TEST SUMMARY ==========");
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
  });
  
  console.log("\nRESULTS:");
  console.log(`TOTAL: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${total - passed}`);
  console.log(`SUCCESS RATE: ${(passed / total * 100).toFixed(2)}%`);
  
  if (passed === total) {
    console.log("\n✅ All analytics tests passed!");
  } else {
    console.log("\n⚠️ Some tests failed. Review the logs above for details.");
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error("Error running tests:", error);
  process.exit(1);
});

// Export functions for potential use in other modules
export {
  runAllTests,
  testOverallAnalytics,
  testTestAnalytics,
  testTagFunctionality
};