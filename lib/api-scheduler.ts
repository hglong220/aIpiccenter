/**
 * API调度器
 * 负责智能选择可用的API密钥，实现负载均衡和故障转移
 */

import { prisma } from './prisma'

export interface APIKeyInfo {
    id: string
    apiKey: string
    endpoint: string | null
    name: string
    providerId: string
}

export class APIScheduler {
    /**
     * 获取可用的API密钥
     * @param providerName 提供商名称 (gemini, claude, gpt等)
     * @returns API密钥信息
     */
    async getAvailableAPIKey(providerName: string): Promise<APIKeyInfo | null> {
        try {
            // 查找提供商
            const provider = await prisma.aIProvider.findUnique({
                where: { name: providerName, enabled: true },
                include: {
                    apiKeys: {
                        where: {
                            enabled: true,
                            status: { in: ['active', 'rate_limited'] },
                        },
                        orderBy: [
                            { priority: 'desc' },
                            { weight: 'desc' },
                        ],
                    },
                },
            })

            if (!provider || provider.apiKeys.length === 0) {
                console.warn(`No available API keys for provider: ${providerName}`)
                return null
            }

            // 重置超过1分钟的使用计数
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
            await prisma.aPIKey.updateMany({
                where: {
                    providerId: provider.id,
                    lastResetAt: { lt: oneMinuteAgo },
                },
                data: {
                    currentUsage: 0,
                    lastResetAt: new Date(),
                },
            })

            // 过滤可用的密钥
            const availableKeys = provider.apiKeys.filter((key) => {
                // 如果有速率限制，检查是否超限
                if (key.maxRequestsPerMinute && key.currentUsage >= key.maxRequestsPerMinute) {
                    return false
                }
                // 如果状态是rate_limited，检查是否已过1分钟
                if (key.status === 'rate_limited') {
                    const lastError = key.lastErrorAt || key.lastResetAt
                    const timeSinceError = Date.now() - lastError.getTime()
                    return timeSinceError > 60 * 1000 // 1分钟后重试
                }
                return true
            })

            if (availableKeys.length === 0) {
                console.warn(`All API keys are rate limited for provider: ${providerName}`)
                return null
            }

            // 基于权重的随机选择
            const totalWeight = availableKeys.reduce((sum, key) => sum + key.weight, 0)
            let random = Math.random() * totalWeight

            let selectedKey = availableKeys[0]
            for (const key of availableKeys) {
                random -= key.weight
                if (random <= 0) {
                    selectedKey = key
                    break
                }
            }

            return {
                id: selectedKey.id,
                apiKey: this.decryptAPIKey(selectedKey.apiKey),
                endpoint: selectedKey.endpoint,
                name: selectedKey.name,
                providerId: provider.id,
            }
        } catch (error) {
            console.error('Error getting available API key:', error)
            return null
        }
    }

    /**
     * 记录API使用情况
     */
    async recordUsage(keyId: string, success: boolean, errorMessage?: string): Promise<void> {
        try {
            const updateData: any = {
                currentUsage: { increment: 1 },
                totalRequests: { increment: 1 },
                lastUsedAt: new Date(),
            }

            if (success) {
                updateData.successfulRequests = { increment: 1 }
                updateData.status = 'active'
            } else {
                updateData.failedRequests = { increment: 1 }
                updateData.lastErrorAt = new Date()

                // 如果是速率限制错误，标记状态
                if (errorMessage?.toLowerCase().includes('rate limit') ||
                    errorMessage?.toLowerCase().includes('quota')) {
                    updateData.status = 'rate_limited'
                } else {
                    updateData.status = 'error'
                }
            }

            await prisma.aPIKey.update({
                where: { id: keyId },
                data: updateData,
            })
        } catch (error) {
            console.error('Error recording API usage:', error)
        }
    }

    /**
     * 标记API为限流状态
     */
    async markRateLimited(keyId: string): Promise<void> {
        try {
            await prisma.aPIKey.update({
                where: { id: keyId },
                data: {
                    status: 'rate_limited',
                    lastErrorAt: new Date(),
                },
            })
        } catch (error) {
            console.error('Error marking API as rate limited:', error)
        }
    }

    /**
     * 健康检查
     */
    async healthCheck(keyId: string): Promise<boolean> {
        try {
            const key = await prisma.aPIKey.findUnique({
                where: { id: keyId },
            })

            if (!key || !key.enabled) {
                return false
            }

            // 如果状态是error，检查是否已过5分钟
            if (key.status === 'error') {
                const lastError = key.lastErrorAt || new Date(0)
                const timeSinceError = Date.now() - lastError.getTime()
                if (timeSinceError > 5 * 60 * 1000) {
                    // 5分钟后重置为active
                    await prisma.aPIKey.update({
                        where: { id: keyId },
                        data: { status: 'active' },
                    })
                    return true
                }
                return false
            }

            return key.status === 'active' || key.status === 'rate_limited'
        } catch (error) {
            console.error('Error in health check:', error)
            return false
        }
    }

    /**
     * 解密API密钥
     * TODO: 实现真正的加密/解密
     */
    private decryptAPIKey(encryptedKey: string): string {
        // 暂时直接返回，后续实现AES加密
        return encryptedKey
    }

    /**
     * 获取提供商统计信息
     */
    async getProviderStats(providerId: string) {
        const keys = await prisma.aPIKey.findMany({
            where: { providerId },
        })

        const totalRequests = keys.reduce((sum, key) => sum + key.totalRequests, 0)
        const successfulRequests = keys.reduce((sum, key) => sum + key.successfulRequests, 0)
        const failedRequests = keys.reduce((sum, key) => sum + key.failedRequests, 0)
        const activeKeys = keys.filter((k) => k.enabled && k.status === 'active').length

        return {
            totalKeys: keys.length,
            activeKeys,
            totalRequests,
            successfulRequests,
            failedRequests,
            successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        }
    }
}

// 单例实例
export const apiScheduler = new APIScheduler()
