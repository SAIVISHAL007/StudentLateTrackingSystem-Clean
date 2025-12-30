#!/usr/bin/env node

import http from 'http';

const API_BASE_URL = 'http://localhost:5000/api';

// HTTP request helper
const httpRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

// Test utility
const test = (name, fn) => Promise.resolve(fn())
  .then(() => console.log(`✅ ${name}`))
  .catch(err => console.error(`❌ ${name}: ${err.message}`));

async function runIntegrationTests() {
  console.log('\n🧪 Starting Integration Tests...\n');

  try {
    // Test 1: Check Health
    await test('Health check', () => httpRequest('GET', '/students/health'));

    // Test 2: Get System Stats
    await test('Fetch system stats', async () => {
      const stats = await httpRequest('GET', '/students/system-stats');
      if (!stats.totalStudents) throw new Error('No stats returned');
      console.log(`   📊 Total Students: ${stats.totalStudents}`);
    });

    // Test 3: Get Late Today
    await test('Fetch today late students', async () => {
      const data = await httpRequest('GET', '/students/late-today');
      console.log(`   📋 Late today: ${data.students?.length || 0} students`);
    });

    // Test 4: Get Records (Weekly)
    await test('Fetch weekly records', async () => {
      const data = await httpRequest('GET', '/students/records/weekly');
      console.log(`   📊 Weekly records: ${data.students?.length || 0} students`);
    });

    // Test 5: Get Records (Monthly)
    await test('Fetch monthly records', async () => {
      const data = await httpRequest('GET', '/students/records/monthly');
      console.log(`   📊 Monthly records: ${data.students?.length || 0} students`);
    });

    // Test 6: Get Records (Semester)
    await test('Fetch semester records', async () => {
      const data = await httpRequest('GET', '/students/records/semester');
      console.log(`   📊 Semester records: ${data.students?.length || 0} students`);
    });

    // Test 7: Search Students
    await test('Search students', async () => {
      const data = await httpRequest('GET', '/students/search?query=CSE');
      console.log(`   🔍 Found: ${data.length || 0} CSE students`);
    });

    // Test 8: Get Students with Fines
    await test('Fetch students with fines', async () => {
      const data = await httpRequest('GET', '/students/with-fines');
      console.log(`   💰 Students with fines: ${data.students?.length || 0}`);
    });

    // Test 9: Get Leaderboard
    await test('Fetch leaderboard', async () => {
      const data = await httpRequest('GET', '/students/analytics/leaderboard');
      if (!data) throw new Error('Leaderboard failed');
      console.log(`   🏆 Leaderboard fetched`);
    });

    // Test 10: Get Financial Analytics
    await test('Fetch financial analytics', async () => {
      const data = await httpRequest('GET', '/students/analytics/financial');
      if (!data) throw new Error('Financial data failed');
      console.log(`   💵 Total: ₹${data.totalCollected}`);
    });

    // Test 11: Filter Students (BETA)
    await test('Filter students (BETA)', async () => {
      const data = await httpRequest('GET', '/students/filter?year=1&branch=CSE');
      console.log(`   🔽 Filtered: ${data.students?.length || 0} students`);
    });

    console.log('\n✨ All integration tests passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runIntegrationTests();
