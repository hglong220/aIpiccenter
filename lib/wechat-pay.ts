/**
 * WeChat Pay Integration
 * 
 * 微信支付集成工具
 * 支持 JSAPI（公众号支付）、H5 支付、Native 支付
 */

import crypto from 'crypto'
import xml2js from 'xml2js'

// 微信支付配置
const WECHAT_PAY_APP_ID = process.env.WECHAT_PAY_APP_ID || ''
const WECHAT_PAY_MCH_ID = process.env.WECHAT_PAY_MCH_ID || ''
const WECHAT_PAY_API_KEY = process.env.WECHAT_PAY_API_KEY || ''
const WECHAT_PAY_NOTIFY_URL = process.env.WECHAT_PAY_NOTIFY_URL || ''

// 微信支付 API 地址
const WECHAT_PAY_API_BASE = 'https://api.mch.weixin.qq.com'
const WECHAT_PAY_UNIFIED_ORDER = `${WECHAT_PAY_API_BASE}/pay/unifiedorder`
const WECHAT_PAY_ORDER_QUERY = `${WECHAT_PAY_API_BASE}/pay/orderquery`

/**
 * 生成随机字符串
 */
function generateNonceStr(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成签名
 */
function generateSign(params: Record<string, string | number>, key: string): string {
  // 1. 参数名ASCII码从小到大排序（字典序）
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 拼接成 key1=value1&key2=value2 格式
  const stringA = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  // 3. 拼接 API 密钥
  const stringSignTemp = `${stringA}&key=${key}`
  
  // 4. MD5 加密并转大写
  const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase()
  
  return sign
}

/**
 * 验证签名
 */
export function verifySign(params: Record<string, string>, sign: string, key: string): boolean {
  const calculatedSign = generateSign(params, key)
  return calculatedSign === sign
}

/**
 * 统一下单（H5 支付）
 */
export async function createUnifiedOrder(params: {
  outTradeNo: string // 商户订单号
  body: string // 商品描述
  totalFee: number // 总金额（分）
  spbillCreateIp: string // 终端 IP
  openid?: string // 用户 openid（JSAPI 支付需要）
  tradeType: 'JSAPI' | 'H5' | 'NATIVE' // 交易类型
}): Promise<{
  prepayId?: string
  codeUrl?: string
  mwebUrl?: string
  error?: string
}> {
  try {
    const nonceStr = generateNonceStr()
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // 构建请求参数
    const requestParams: Record<string, string | number> = {
      appid: WECHAT_PAY_APP_ID,
      mch_id: WECHAT_PAY_MCH_ID,
      nonce_str: nonceStr,
      body: params.body,
      out_trade_no: params.outTradeNo,
      total_fee: params.totalFee,
      spbill_create_ip: params.spbillCreateIp,
      notify_url: WECHAT_PAY_NOTIFY_URL,
      trade_type: params.tradeType,
    }

    // JSAPI 支付需要 openid
    if (params.tradeType === 'JSAPI' && params.openid) {
      requestParams.openid = params.openid
    }

    // H5 支付需要场景信息
    if (params.tradeType === 'H5') {
      requestParams.scene_info = JSON.stringify({
        h5_info: {
          type: 'Wap',
          wap_url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
          wap_name: 'AI Pic Center',
        },
      })
    }

    // 生成签名
    const sign = generateSign(requestParams, WECHAT_PAY_API_KEY)
    requestParams.sign = sign

    // 构建 XML
    const builder = new xml2js.Builder({ rootName: 'xml', headless: true })
    const xml = builder.buildObject(requestParams)

    // 发送请求
    const response = await fetch(WECHAT_PAY_UNIFIED_ORDER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xml,
    })

    const responseText = await response.text()
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true })
    const result = await parser.parseStringPromise(responseText)

    if (result.xml.return_code === 'SUCCESS' && result.xml.result_code === 'SUCCESS') {
      if (params.tradeType === 'JSAPI') {
        return { prepayId: result.xml.prepay_id }
      } else if (params.tradeType === 'H5') {
        return { mwebUrl: result.xml.mweb_url }
      } else if (params.tradeType === 'NATIVE') {
        return { codeUrl: result.xml.code_url }
      }
    }

    return {
      error: result.xml.err_code_des || result.xml.return_msg || '统一下单失败',
    }
  } catch (error) {
    console.error('微信支付统一下单错误:', error)
    return {
      error: error instanceof Error ? error.message : '统一下单失败',
    }
  }
}

/**
 * 查询订单
 */
export async function queryOrder(outTradeNo: string): Promise<{
  tradeState?: string
  transactionId?: string
  error?: string
}> {
  try {
    const nonceStr = generateNonceStr()
    const requestParams: Record<string, string> = {
      appid: WECHAT_PAY_APP_ID,
      mch_id: WECHAT_PAY_MCH_ID,
      out_trade_no: outTradeNo,
      nonce_str: nonceStr,
    }

    const sign = generateSign(requestParams, WECHAT_PAY_API_KEY)
    requestParams.sign = sign

    const builder = new xml2js.Builder({ rootName: 'xml', headless: true })
    const xml = builder.buildObject(requestParams)

    const response = await fetch(WECHAT_PAY_ORDER_QUERY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xml,
    })

    const responseText = await response.text()
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true })
    const result = await parser.parseStringPromise(responseText)

    if (result.xml.return_code === 'SUCCESS' && result.xml.result_code === 'SUCCESS') {
      return {
        tradeState: result.xml.trade_state,
        transactionId: result.xml.transaction_id,
      }
    }

    return {
      error: result.xml.err_code_des || result.xml.return_msg || '查询订单失败',
    }
  } catch (error) {
    console.error('微信支付查询订单错误:', error)
    return {
      error: error instanceof Error ? error.message : '查询订单失败',
    }
  }
}

/**
 * 解析支付回调 XML
 */
export async function parseNotifyXml(xml: string): Promise<{
  out_trade_no: string
  transaction_id: string
  total_fee: string | number
  return_code: string
  result_code: string
  return_msg?: string
  err_code_des?: string
  sign: string
  [key: string]: string | number | undefined
}> {
  const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true })
  const result = await parser.parseStringPromise(xml)
  return result.xml as {
    out_trade_no: string
    transaction_id: string
    total_fee: string | number
    return_code: string
    result_code: string
    return_msg?: string
    err_code_des?: string
    sign: string
    [key: string]: string | number | undefined
  }
}

/**
 * 生成支付回调响应 XML
 */
export function generateNotifyResponse(returnCode: 'SUCCESS' | 'FAIL', returnMsg?: string): string {
  const builder = new xml2js.Builder({ rootName: 'xml', headless: true })
  return builder.buildObject({
    return_code: returnCode,
    return_msg: returnMsg || (returnCode === 'SUCCESS' ? 'OK' : 'FAIL'),
  })
}

