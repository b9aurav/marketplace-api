const fetch = require('node-fetch');

async function testNonAdminAuth() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔐 Testing non-admin authentication...\n');
    
    // Step 1: Login with non-admin credentials
    console.log('1. Logging in with non-admin credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'user123'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('❌ Login failed:', error);
      console.log('   Please make sure you have registered the non-admin user with email "user@example.com" and password "user123"\n');
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    
    const { token, user } = loginData.data;
    
    if (!token) {
      console.error('❌ No access token received');
      return;
    }
    
    console.log('   User:', user);
    
    // Step 2: Test admin endpoint
    console.log('\n2. Attempting to access admin endpoint...');
    const adminResponse = await fetch(`${baseUrl}/api/admin/orders?page=1&limit=10&sort_by=created_at&sort_order=desc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    console.log(adminResponse);
    if (adminResponse.status === 403) {
      console.log('✅ SUCCESS: Received 403 Forbidden as expected!');
    } else {
      console.error(`❌ FAILURE: Expected status 403 Forbidden, but received ${adminResponse.status}`);
      const responseBody = await adminResponse.text();
      console.error('   Response:', responseBody);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNonAdminAuth();
