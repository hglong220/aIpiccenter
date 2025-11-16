# AI 调度器文档

本文档说明 AI 调度器的功能和使用方法。

## 📋 功能概述

AI 调度器提供以下核心功能：

1. **智能模型推荐**：基于任务类型、成本、性能自动推荐最佳模型
2. **模型失败自动降级（Fallback）**：主模型失败时自动切换到备用模型
3. **API Key 池轮询**：多个 Key 轮询使用，防止单个 Key 被封
4. **成本控制**：根据预算自动选择便宜的模型
5. **任务链执行**：支持文本 → 图 → 视频等链式任务

## 🎯 智能模型推荐

### 推荐算法

模型推荐综合考虑以下因素：

- **成本**：根据预算（low/normal/high）调整成本权重
- **质量**：模型输出质量评分
- **速度**：模型响应速度评分
- **可靠性**：模型稳定性评分
- **优先级**：任务优先级影响权重分配

### 使用示例

```typescript
import { getAIRouter } from '@/lib/ai-router'

const router = getAIRouter()

// 自动推荐模型（考虑成本）
const task = await router.routeTask(
  userId,
  {
    prompt: 'Generate an image',
    type: 'image',
    budget: 'low', // 选择便宜的模型
  },
  'normal'
)

// 指定模型
const task2 = await router.routeTask(
  userId,
  {
    prompt: 'Generate text',
    type: 'text',
    model: 'gpt-4', // 强制使用 GPT-4
  },
  'high' // 高优先级
)
```

## 🔄 模型降级（Fallback）

### 工作原理

1. 主模型执行任务
2. 如果失败，自动切换到第一个降级模型
3. 继续尝试直到成功或所有模型都失败

### 配置降级模型

降级模型可以在模型配置中设置：

```typescript
// 在 ModelManager 中配置
this.models.set('runway', {
  type: 'runway',
  fallback: ['pika', 'kling'], // 降级顺序
})
```

如果没有配置，系统会根据任务类型自动选择降级模型。

## 🔑 API Key 管理

### Key 轮询

- 多个 Key 自动轮询使用
- 优先使用使用次数少的 Key
- 优先使用最后使用时间早的 Key

### Key 健康检查

- 记录每个 Key 的成功/失败次数
- 连续失败 3 次自动阻止 1 小时
- 阻止期过后自动恢复

### 使用示例

```typescript
import { getAPIKeyManager } from '@/lib/ai-scheduler'

const keyManager = getAPIKeyManager()

// 获取下一个可用的 Key
const apiKey = keyManager.getNextKey('gemini-pro', ['key1', 'key2', 'key3'])

// 记录成功
keyManager.recordSuccess('gemini-pro', apiKey)

// 记录失败
keyManager.recordFailure('gemini-pro', apiKey, 'Rate limit exceeded')
```

## 💰 成本控制

### 模型成本配置

模型成本在 `lib/ai-scheduler.ts` 中定义：

```typescript
const MODEL_COSTS: Record<ModelType, ModelCost> = {
  'gemini-flash': {
    inputTokens: 0.0001,
    outputTokens: 0.0003,
    image: 0.01,
    video: 0,
  },
  // ...
}
```

### 预算模式

- **low**：优先选择便宜的模型（成本权重 60%）
- **normal**：平衡成本和性能（成本权重 40%）
- **high**：优先选择高质量模型（成本权重 20%）

## 🔗 任务链执行

### 任务链配置

任务链允许将多个任务串联执行，前一个任务的结果作为下一个任务的输入。

### 使用示例

```typescript
import { getAIRouter } from '@/lib/ai-router'

const router = getAIRouter()

// 执行任务链：文本生成 → 图像生成 → 视频生成
const results = await router.executeTaskChain(userId, {
  steps: [
    {
      taskType: 'text',
      input: { prompt: 'Write a story about a cat' },
    },
    {
      taskType: 'image',
      input: { prompt: 'Generate an image' },
      dependsOn: 0, // 依赖第 0 步的结果
    },
    {
      taskType: 'video',
      input: { prompt: 'Create a video' },
      dependsOn: 1, // 依赖第 1 步的结果
    },
  ],
})
```

### API 调用

```bash
POST /api/ai/chain
Content-Type: application/json

{
  "steps": [
    {
      "taskType": "text",
      "input": { "prompt": "..." }
    },
    {
      "taskType": "image",
      "input": { "prompt": "..." },
      "dependsOn": 0
    }
  ]
}
```

## 📊 模型性能配置

模型性能评分（1-10）：

- **速度**：响应速度
- **质量**：输出质量
- **可靠性**：稳定性

```typescript
const MODEL_PERFORMANCE: Record<ModelType, ModelPerformance> = {
  'gpt-4': { speed: 6, quality: 10, reliability: 9 },
  'gemini-flash': { speed: 9, quality: 8, reliability: 8 },
  // ...
}
```

## 🔍 监控和调试

### 查看 Key 统计

```typescript
import { getAPIKeyManager } from '@/lib/ai-scheduler'

const keyManager = getAPIKeyManager()
const stats = keyManager.getKeyStats('gemini-pro')

// stats 包含每个 Key 的使用统计
```

### 查看任务状态

```typescript
const task = await prisma.aiTask.findUnique({
  where: { id: taskId },
})

console.log(task.model) // 当前使用的模型
console.log(task.retryCount) // 重试次数
console.log(task.fallbackModels) // 降级模型列表
```

## ⚙️ 配置

### 环境变量

支持多个 API Key（用逗号分隔）：

```env
GOOGLE_GEMINI_API_KEY=key1,key2,key3
OPENAI_API_KEY=key1,key2
RUNWAY_API_KEY=key1,key2
```

### 模型启用/禁用

模型是否启用取决于环境变量是否存在：

```typescript
enabled: !!process.env.GOOGLE_GEMINI_API_KEY
```

## 📚 相关文档

- [队列系统文档](./QUEUE_SYSTEM.md)
- [AI Router 文档](./lib/ai-router.ts)

