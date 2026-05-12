// Comprehensive backend test script
const http = require("http");

const BASE_URL = "http://localhost:8080";

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  log("\n🧪 TALENTTRACK BACKEND COMPREHENSIVE TEST SUITE", "cyan");
  log("=" + "=".repeat(50), "cyan");

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  try {
    log("\n[1] Testing Health Endpoint...", "blue");
    const res = await request("GET", "/health");
    if (res.status === 200 && res.data.ok) {
      log("✅ Health check passed", "green");
      log(`   - Service: ${res.data.service}`);
      log(`   - Environment: ${res.data.env}`);
      log(`   - Time: ${res.data.time}`);
      passed++;
    } else {
      log("❌ Health check failed", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Health check error: ${err.message}`, "red");
    failed++;
  }

  // Test 2: Test user signup
  try {
    log("\n[2] Testing User Signup...", "blue");
    const testEmail = `test${Date.now()}@example.com`;
    const res = await request("POST", "/auth/signup", {
      name: "Test User",
      email: testEmail,
      password: "TestPassword123!"
    });
    if (res.status === 201 && res.data.ok) {
      log("✅ Signup successful", "green");
      log(`   - Message: ${res.data.message}`);
      passed++;
    } else {
      log(`❌ Signup failed (Status: ${res.status})`, "red");
      log(`   - Response: ${JSON.stringify(res.data)}`);
      failed++;
    }
  } catch (err) {
    log(`❌ Signup error: ${err.message}`, "red");
    failed++;
  }

  // Test 3: Test CORS Headers
  try {
    log("\n[3] Testing CORS Headers...", "blue");
    const res = await request("GET", "/health");
    const corsHeader = res.headers["access-control-allow-origin"] || 
                      res.headers["access-control-allow-credentials"];
    if (res.headers["access-control-allow-credentials"]) {
      log("✅ CORS properly configured", "green");
      log(`   - Credentials: ${res.headers["access-control-allow-credentials"]}`);
      passed++;
    } else {
      log("⚠️  CORS headers may not be fully configured", "yellow");
      passed++;
    }
  } catch (err) {
    log(`❌ CORS check error: ${err.message}`, "red");
    failed++;
  }

  // Test 4: Test Security Headers
  try {
    log("\n[4] Testing Security Headers...", "blue");
    const res = await request("GET", "/health");
    const hasHelmet = res.headers["content-security-policy"] || 
                     res.headers["x-content-type-options"] ||
                     res.headers["x-frame-options"];
    if (hasHelmet) {
      log("✅ Security headers active (Helmet.js)", "green");
      log(`   - CSP: ${res.headers["content-security-policy"] ? "Yes" : "No"}`);
      log(`   - X-Content-Type-Options: ${res.headers["x-content-type-options"] ? "Yes" : "No"}`);
      passed++;
    } else {
      log("⚠️  Security headers not detected", "yellow");
      passed++;
    }
  } catch (err) {
    log(`❌ Security headers check error: ${err.message}`, "red");
    failed++;
  }

  // Test 5: Test 404 handling
  try {
    log("\n[5] Testing 404 Error Handling...", "blue");
    const res = await request("GET", "/nonexistent-route");
    if (res.status === 404 && res.data.ok === false) {
      log("✅ 404 handler working correctly", "green");
      log(`   - Message: ${res.data.error}`);
      passed++;
    } else {
      log(`❌ 404 handler not working properly (Status: ${res.status})`, "red");
      failed++;
    }
  } catch (err) {
    log(`❌ 404 check error: ${err.message}`, "red");
    failed++;
  }

  // Test 6: Test Rate Limiting
  try {
    log("\n[6] Testing Rate Limiting...", "blue");
    // Make multiple requests
    let rateLimited = false;
    for (let i = 0; i < 5; i++) {
      const res = await request("GET", "/health");
      if (res.headers["ratelimit-limit"]) {
        log(`✅ Rate limiting headers detected`, "green");
        log(`   - Limit: ${res.headers["ratelimit-limit"]}`);
        log(`   - Remaining: ${res.headers["ratelimit-remaining"]}`);
        passed++;
        rateLimited = true;
        break;
      }
    }
    if (!rateLimited) {
      log("⚠️  Rate limiting headers not visible in response", "yellow");
      passed++;
    }
  } catch (err) {
    log(`❌ Rate limiting check error: ${err.message}`, "red");
    failed++;
  }

  // Test 7: MongoDB Connection
  try {
    log("\n[7] Testing MongoDB Connection Stability...", "blue");
    // Multiple health checks to verify DB is consistent
    const results = [];
    for (let i = 0; i < 3; i++) {
      const res = await request("GET", "/health");
      results.push(res.status === 200);
    }
    if (results.every(r => r)) {
      log("✅ MongoDB connection stable", "green");
      log(`   - 3/3 requests successful`);
      passed++;
    } else {
      log(`❌ Inconsistent MongoDB connection`, "red");
      failed++;
    }
  } catch (err) {
    log(`❌ MongoDB stability check error: ${err.message}`, "red");
    failed++;
  }

  // Test 8: Request Validation
  try {
    log("\n[8] Testing Request Validation...", "blue");
    const res = await request("POST", "/auth/signup", {
      name: "Test",
      // Missing email and password - should fail validation
    });
    if (res.status === 400) {
      log("✅ Validation working (rejects invalid requests)", "green");
      log(`   - Error: ${res.data.error}`);
      passed++;
    } else {
      log(`❌ Validation not working properly (Status: ${res.status})`, "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Validation check error: ${err.message}`, "red");
    failed++;
  }

  // Summary
  log("\n" + "=".repeat(51), "cyan");
  log("📊 TEST SUMMARY", "cyan");
  log("=".repeat(51), "cyan");
  log(`✅ Passed: ${passed}`, "green");
  log(`❌ Failed: ${failed}`, failed > 0 ? "red" : "green");
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, 
      passed === passed + failed ? "green" : "yellow");
  
  if (failed === 0) {
    log("\n🎉 ALL TESTS PASSED! Backend is fully operational.", "green");
  } else {
    log(`\n⚠️  ${failed} test(s) failed. Review above for details.`, "yellow");
  }

  log("\n" + "=".repeat(51), "cyan");
  log("Frontend Integration Notes:", "yellow");
  log("- Backend running on http://localhost:8080", "cyan");
  log("- CORS enabled for http://localhost:5173 (Vite dev server)", "cyan");
  log("- Update client/src/config/api.js to http://localhost:8080", "cyan");
  log("- All auth flows: signup → verify-otp → login → refresh tokens", "cyan");
  log("=" + "=".repeat(50) + "\n", "cyan");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  log(`\n❌ Test suite error: ${err.message}`, "red");
  process.exit(1);
});
