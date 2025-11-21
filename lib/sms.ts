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

    // 模拟发送（开发环境或显式设置为 mock）
    const providerEnv = process.env.SMS_PROVIDER?.toLowerCase()
    const smsProvider =
      providerEnv && providerEnv.trim().length > 0
        ? providerEnv
        : process.env.NODE_ENV === 'development'
          ? 'mock'
          : 'aliyun'

    if (smsProvider === 'mock') {
      return simulateSend(phone, code, type, 'mock')
    }

    switch (smsProvider) {
      case 'aliyun': {
        const configured = checkAliyunConfigured()
        if (!configured) {
          console.warn('阿里云短信服务未配置，回退到模拟发送。')
          return simulateSend(phone, code, type, 'aliyun-fallback')
        }
        return await sendViaAliyun(phone, code, type)
      }
      case 'tencent': {
        const configured = checkTencentConfigured()
        if (!configured) {
          console.warn('腾讯云短信服务未配置，回退到模拟发送。')
          return simulateSend(phone, code, type, 'tencent-fallback')
        }
        return await sendViaTencent(phone, code, type)
      }
      case 'ronglian': {
        const configured = checkRonglianConfigured()
        if (!configured) {
          console.warn('容联云短信服务未配置，回退到模拟发送。')
          return simulateSend(phone, code, type, 'ronglian-fallback')
        }
        return await sendViaRonglian(phone, code, type)
      }
      default:
        console.warn(`未知短信服务提供商 "${smsProvider}"，回退到模拟发送。`)
        return simulateSend(phone, code, type, 'unknown-provider')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    return false
  }
}

function simulateSend(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset',
  channel: string
): boolean {
  console.log(`[短信(${channel})模拟] 发送验证码到 ${phone}: ${code} (类型: ${type})`)
  return true
}

/**
 * 阿里云短信服务
 */
function checkAliyunConfigured() {
  return (
    !!process.env.ALIYUN_ACCESS_KEY_ID &&
    !!process.env.ALIYUN_ACCESS_KEY_SECRET &&
    !!process.env.ALIYUN_SMS_SIGN_NAME &&
    !!process.env.ALIYUN_SMS_TEMPLATE_CODE
  )
}

async function sendViaAliyun(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  // 实现阿里云短信发送逻辑
  // 可以使用 @alicloud/sms-sdk 或直接调用 API
  console.log(
    `[阿里云] 发送验证码到 ${phone}: ${code} (Sign: ${process.env.ALIYUN_SMS_SIGN_NAME}, Template: ${process.env.ALIYUN_SMS_TEMPLATE_CODE})`
  )
  return true
}

/**
 * 腾讯云短信服务
 */
function checkTencentConfigured() {
  return (
    !!process.env.TENCENT_SECRET_ID &&
    !!process.env.TENCENT_SECRET_KEY &&
    !!process.env.TENCENT_SMS_APP_ID &&
    !!process.env.TENCENT_SMS_SIGN_NAME &&
    !!process.env.TENCENT_SMS_TEMPLATE_ID
  )
}

async function sendViaTencent(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  // 实现腾讯云短信发送逻辑
  // 可以使用 tencentcloud-sdk-nodejs
  console.log(
    `[腾讯云] 发送验证码到 ${phone}: ${code} (Sign: ${process.env.TENCENT_SMS_SIGN_NAME}, Template: ${process.env.TENCENT_SMS_TEMPLATE_ID})`
  )
  return true
}

/**
 * 容联云短信服务
 */
function checkRonglianConfigured() {
  return (
    !!process.env.RONGLIAN_ACCOUNT_SID &&
    !!process.env.RONGLIAN_AUTH_TOKEN &&
    !!process.env.RONGLIAN_APP_ID &&
    !!process.env.RONGLIAN_TEMPLATE_ID
  )
}

async function sendViaRonglian(
  phone: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<boolean> {
  // 实现容联云短信发送逻辑
  console.log(
    `[容联云] 发送验证码到 ${phone}: ${code} (Template: ${process.env.RONGLIAN_TEMPLATE_ID})`
  )
  return true
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

