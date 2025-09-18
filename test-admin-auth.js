const fetch = require('node-fetch');

async function testAdminAuth() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔐 Testing admin authentication...\n');
    
    // Step 1: Login with admin credentials
    console.log('1. Logging in with admin credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('❌ Login failed:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    
    // Extract the actual data from the response
    const { token, user } = loginData.data;
    
    if (!token) {
      console.error('❌ No access token received');
      console.log('   Full response:', JSON.stringify(loginData, null, 2));
      return;
    }
    
    console.log('   User:', user);
    console.log('   Token preview:', token);
    
    // Step 2: Test admin endpoint
    console.log('2. Testing admin dashboard metrics endpoint...');
    console.log('   Token:', token);
    // http://localhost:3000/api/admin/orders?page=1&limit=10&sort_by=created_at&sort_order=desc
    // http://localhost:3000/api/admin/users?page=1&pageSize=10&search
    const adminResponse = await fetch(`${baseUrl}/api/admin/users?page=1&limit=10&search`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!adminResponse.ok) {
      const error = await adminResponse.text();
      console.error('❌ Admin API call failed:', adminResponse.status, error);
      console.log('   Status:', adminResponse.status);
      console.log('   Error:', error);
      return;
    }
    
    const adminData = await adminResponse.json();
    console.log('✅ Admin API call successful!');
    console.log('   Dashboard metrics:', JSON.stringify(adminData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminAuth();
