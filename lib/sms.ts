/**
 * SMS Verification Code Service
 * 
 * 短信验证码服务
 * 支持阿里云、腾讯云等短信服务
 * 开发环境使用模拟发送
 */

/**
 * 发送验证码短信
 * @param phone 手机号
 * @param code 验证码
 * @param type 类型：register, login, reset
 * @returns 是否发送成功
 */
export async function sendVerificationCode(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  try {
    // 验证手机号格式（中国大陆）
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('手机号格式不正确')
    }

    // 开发环境：模拟发送，直接返回成功
    if (process.env.NODE_ENV === 'development') {
      console.log(`[开发环境] 发送验证码到 ${phone}: ${code} (类型: ${type})`)
      return true
    }

    // 生产环境：集成真实的短信服务
    // 可以选择阿里云、腾讯云、容联云等
    const smsProvider = process.env.SMS_PROVIDER || 'aliyun' // aliyun, tencent, ronglian

    switch (smsProvider) {
      case 'aliyun':
        return await sendViaAliyun(phone, code, type)
      case 'tencent':
        return await sendViaTencent(phone, code, type)
      case 'ronglian':
        return await sendViaRonglian(phone, code, type)
      default:
        throw new Error('未配置短信服务提供商')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    return false
  }
}

/**
 * 阿里云短信服务
 */
async function sendViaAliyun(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  // TODO: 集成阿里云短信服务
  // 需要配置：ACCESS_KEY_ID, ACCESS_KEY_SECRET, SIGN_NAME, TEMPLATE_CODE
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
  const signName = process.env.ALIYUN_SMS_SIGN_NAME
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new Error('阿里云短信服务未配置')
  }

  // 实现阿里云短信发送逻辑
  // 可以使用 @alicloud/sms-sdk 或直接调用 API
  console.log(`[阿里云] 发送验证码到 ${phone}: ${code}`)
  return true
}

/**
 * 腾讯云短信服务
 */
async function sendViaTencent(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  // TODO: 集成腾讯云短信服务
  // 需要配置：SECRET_ID, SECRET_KEY, APP_ID, SIGN_NAME, TEMPLATE_ID
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  const appId = process.env.TENCENT_SMS_APP_ID
  const signName = process.env.TENCENT_SMS_SIGN_NAME
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID

  if (!secretId || !secretKey || !appId || !signName || !templateId) {
    throw new Error('腾讯云短信服务未配置')
  }

  // 实现腾讯云短信发送逻辑
  // 可以使用 tencentcloud-sdk-nodejs
  console.log(`[腾讯云] 发送验证码到 ${phone}: ${code}`)
  return true
}

/**
 * 容联云短信服务
 */
async function sendViaRonglian(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  // TODO: 集成容联云短信服务
  // 需要配置：ACCOUNT_SID, AUTH_TOKEN, APP_ID, TEMPLATE_ID
  const accountSid = process.env.RONGLIAN_ACCOUNT_SID
  const authToken = process.env.RONGLIAN_AUTH_TOKEN
  const appId = process.env.RONGLIAN_APP_ID
  const templateId = process.env.RONGLIAN_TEMPLATE_ID

  if (!accountSid || !authToken || !appId || !templateId) {
    throw new Error('容联云短信服务未配置')
  }

  // 实现容联云短信发送逻辑
  console.log(`[容联云] 发送验证码到 ${phone}: ${code}`)
  return true
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

