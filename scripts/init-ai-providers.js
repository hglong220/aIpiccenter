/**
 * 初始化AI提供商
 * 预置常用的AI模型提供商
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const providers = [
    // 聊天模型
    {
        name: 'gemini',
        type: 'chat',
        displayName: 'Google Gemini',
        description: 'Google的先进AI模型，支持多模态对话',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://generativelanguage.googleapis.com/v1beta',
            models: ['gemini-pro', 'gemini-pro-vision'],
        }),
    },
    {
        name: 'claude',
        type: 'chat',
        displayName: 'Anthropic Claude',
        description: 'Anthropic的Claude AI模型系列',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.anthropic.com/v1',
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        }),
    },
    {
        name: 'gpt',
        type: 'chat',
        displayName: 'OpenAI GPT',
        description: 'OpenAI的GPT模型系列',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.openai.com/v1',
            models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        }),
    },
    {
        name: 'qwen',
        type: 'chat',
        displayName: '通义千问',
        description: '阿里云的通义千问大语言模型',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://dashscope.aliyuncs.com/api/v1',
            models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
        }),
    },

    // 图像生成模型
    {
        name: 'midjourney',
        type: 'image',
        displayName: 'Midjourney',
        description: '强大的AI图像生成工具',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.midjourney.com/v1',
        }),
    },
    {
        name: 'stable-diffusion',
        type: 'image',
        displayName: 'Stable Diffusion',
        description: '开源的AI图像生成模型',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.stability.ai/v1',
            models: ['sd-xl-1.0', 'sd-2.1'],
        }),
    },
    {
        name: 'dall-e',
        type: 'image',
        displayName: 'DALL-E',
        description: 'OpenAI的图像生成模型',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.openai.com/v1',
            models: ['dall-e-3', 'dall-e-2'],
        }),
    },
    {
        name: 'tongyi-wanxiang',
        type: 'image',
        displayName: '通义万相',
        description: '阿里云的AI图像生成服务',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://dashscope.aliyuncs.com/api/v1',
        }),
    },

    // 视频生成模型
    {
        name: 'sora',
        type: 'video',
        displayName: 'OpenAI Sora',
        description: 'OpenAI的文本生成视频模型',
        enabled: false, // 暂未公开
        config: JSON.stringify({
            endpoint: 'https://api.openai.com/v1',
        }),
    },
    {
        name: 'runway',
        type: 'video',
        displayName: 'Runway Gen-2',
        description: 'Runway的视频生成工具',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.runwayml.com/v1',
        }),
    },
    {
        name: 'kling',
        type: 'video',
        displayName: 'Kling',
        description: '快手的AI视频生成模型',
        enabled: true,
        config: JSON.stringify({
            endpoint: 'https://api.kling.kuaishou.com/v1',
        }),
    },
]

async function main() {
    console.log('开始初始化AI提供商...')

    for (const provider of providers) {
        try {
            const existing = await prisma.aIProvider.findUnique({
                where: { name: provider.name },
            })

            if (existing) {
                console.log(`✓ ${provider.displayName} 已存在，跳过`)
                continue
            }

            await prisma.aIProvider.create({
                data: provider,
            })
            console.log(`✓ 创建 ${provider.displayName}`)
        } catch (error) {
            console.error(`✗ 创建 ${provider.displayName} 失败:`, error.message)
        }
    }

    console.log('\n初始化完成！')
    console.log(`共创建 ${providers.length} 个AI提供商`)
}

main()
    .catch((e) => {
        console.error('初始化失败:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
