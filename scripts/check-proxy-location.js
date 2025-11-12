/**
 * 检查代理服务器地理位置
 * 用于诊断位置限制问题
 */

const { fetch, ProxyAgent } = require('undici');

const PROXY_URL = process.env.GEMINI_PROXY_URL || 
                  process.env.HTTPS_PROXY || 
                  process.env.HTTP_PROXY || 
                  'http://34.87.103.25:3128'; // 默认使用新加坡IP

async function checkProxyLocation() {
  console.log('========================================');
  console.log('检查代理服务器地理位置');
  console.log('========================================\n');

  console.log(`代理地址: ${PROXY_URL}\n`);

  try {
    const agent = new ProxyAgent(PROXY_URL);
    
    console.log('正在通过代理检查 IP 地理位置...\n');

    // 使用多个 IP 地理位置服务
    const services = [
      { name: 'ipapi.co', url: 'https://ipapi.co/json/' },
      { name: 'ip-api.com', url: 'http://ip-api.com/json/' },
      { name: 'ipinfo.io', url: 'https://ipinfo.io/json' },
    ];

    for (const service of services) {
      try {
        console.log(`检查服务: ${service.name}...`);
        const response = await fetch(service.url, {
          dispatcher: agent,
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          
          if (service.name === 'ipapi.co') {
            console.log(`  ✅ IP 地址: ${data.ip || 'N/A'}`);
            console.log(`  ✅ 国家: ${data.country_name || 'N/A'} (${data.country_code || 'N/A'})`);
            console.log(`  ✅ 城市: ${data.city || 'N/A'}`);
            console.log(`  ✅ 地区: ${data.region || 'N/A'}`);
            console.log(`  ✅ ISP: ${data.org || 'N/A'}\n`);
          } else if (service.name === 'ip-api.com') {
            console.log(`  ✅ IP 地址: ${data.query || 'N/A'}`);
            console.log(`  ✅ 国家: ${data.country || 'N/A'} (${data.countryCode || 'N/A'})`);
            console.log(`  ✅ 城市: ${data.city || 'N/A'}`);
            console.log(`  ✅ 地区: ${data.regionName || 'N/A'}`);
            console.log(`  ✅ ISP: ${data.isp || 'N/A'}\n`);
          } else if (service.name === 'ipinfo.io') {
            console.log(`  ✅ IP 地址: ${data.ip || 'N/A'}`);
            console.log(`  ✅ 国家: ${data.country || 'N/A'}`);
            console.log(`  ✅ 城市: ${data.city || 'N/A'}`);
            console.log(`  ✅ 地区: ${data.region || 'N/A'}`);
            console.log(`  ✅ ISP: ${data.org || 'N/A'}\n`);
          }

          // 检查是否在支持 Gemini API 的地区
          const country = data.country_name || data.country || '';
          const countryCode = data.country_code || data.countryCode || '';
          
          console.log('地区支持检查:');
          if (countryCode === 'CN' || countryCode === 'HK') {
            console.log(`  ⚠️  当前地区 (${country}) 可能不支持 Gemini API`);
            console.log(`  建议: 使用其他地区的代理服务器\n`);
          } else {
            console.log(`  ✅ 当前地区 (${country}) 可能支持 Gemini API\n`);
          }

          break; // 成功获取信息后退出循环
        }
      } catch (error) {
        console.log(`  ❌ ${service.name} 检查失败: ${error.message}\n`);
        continue;
      }
    }

  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}\n`);
  }

  console.log('========================================');
  console.log('检查完成');
  console.log('========================================\n');

  console.log('如果当前地区不支持 Gemini API，需要：');
  console.log('1. 获取支持地区的代理服务器');
  console.log('2. 更新启动脚本中的代理配置');
  console.log('3. 重新测试 API 调用\n');
}

checkProxyLocation().catch(console.error);


