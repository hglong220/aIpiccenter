/**
 * 测试 Gemini API（直接连接，不使用代理）
 */

const { fetch } = require('undici');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function testGeminiAPI() {
  console.log('========================================');
  console.log('Gemini API Test (Direct Connection)');
  console.log('========================================\n');

  // Check API Key
  if (!API_KEY || API_KEY === 'your-gemini-api-key') {
    console.log('❌ Error: GOOGLE_GEMINI_API_KEY not configured');
    console.log('   Please set API Key in environment variables\n');
    return;
  }

  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Proxy: None (direct connection)\n`);

  try {
    const requestBody = {
      contents: [
        {
          parts: [{ text: 'Hello, say hi in one sentence.' }],
        },
      ],
    };

    const apiUrl = `${API_ENDPOINT}?key=${API_KEY}`;
    console.log(`Request URL: ${API_ENDPOINT}?key=***\n`);

    console.log('Sending request...\n');

    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    const endTime = Date.now();

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Time: ${endTime - startTime}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API call failed');
      console.log(`Error content: ${errorText.substring(0, 500)}\n`);
      
      if (response.status === 401) {
        console.log('Possible reason: Invalid or expired API Key');
      } else if (response.status === 403) {
        console.log('Possible reason: API Key does not have permission');
      } else if (response.status === 404) {
        console.log('Possible reason: Model not found or not available');
        console.log('Trying alternative models...\n');
        
        // Try alternative models
        const alternativeModels = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.0-pro'];
        for (const altModel of alternativeModels) {
          console.log(`Trying model: ${altModel}...`);
          const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/${altModel}:generateContent?key=${API_KEY}`;
          try {
            const altResponse = await fetch(altUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: AbortSignal.timeout(10000),
            });
            if (altResponse.ok) {
              const altData = await altResponse.json();
              const text = altData?.candidates?.[0]?.content?.parts
                ?.map((part) => part.text || '')
                .join('\n')
                .trim();
              console.log(`✅ Success with model ${altModel}!`);
              console.log(`Response: ${text}\n`);
              return;
            }
          } catch (e) {
            console.log(`  Failed: ${e.message}`);
          }
        }
      } else if (response.status >= 500) {
        console.log('Possible reason: Google server error');
      }
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('\n')
      .trim();

    console.log('✅ API call successful!\n');
    console.log('Response content:');
    console.log(text || '(No text response)');
    console.log('\n✅ Gemini API is working correctly!\n');

  } catch (error) {
    console.log('❌ Request failed');
    console.log(`Error: ${error.message}\n`);

    if (error.name === 'AbortError') {
      console.log('Possible reasons:');
      console.log('  - Request timeout (30 seconds)');
      console.log('  - Network connection unstable');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Possible reasons:');
      console.log('  - Cannot connect to Google API servers');
      console.log('  - Network firewall blocking connection');
    } else if (error.message.includes('fetch failed')) {
      console.log('Possible reasons:');
      console.log('  - Network connection issue');
      console.log('  - SSL/TLS handshake failed');
    } else {
      console.log('Possible reasons:');
      console.log('  - Network connection problem');
      console.log('  - API endpoint unreachable');
    }
  }

  console.log('========================================');
}

testGeminiAPI().catch(console.error);

