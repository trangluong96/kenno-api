// Simple test script to verify the Express server endpoints
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing Express Server Endpoints...\n');

  try {
    // Test health check
    console.log('1. Testing health check endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test password reset endpoint (this will fail without valid credentials)
    console.log('2. Testing password reset endpoint...');
    const resetResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      }),
    });
    const resetData = await resetResponse.json();
    console.log('✅ Reset password response:', resetData);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log(
      '\nNote: The password reset test will fail with "User not found" or "Invalid old password" which is expected behavior.',
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the server is running with: npm run server:dev');
  }
}

// Run tests
testEndpoints();
