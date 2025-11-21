/**
 * 检查聊天数据脚本
 * 用于诊断聊天记录是否被正确保存到数据库
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkChatData() {
  try {
    console.log('========================================')
    console.log('聊天数据检查工具')
    console.log('========================================\n')

    // 1. 检查所有会话
    const sessions = await prisma.chatSession.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    console.log(`总共找到 ${sessions.length} 个会话\n`)

    if (sessions.length === 0) {
      console.log('❌ 数据库中没有会话记录！')
      console.log('可能的原因:')
      console.log('1. 消息没有被正确保存')
      console.log('2. 数据库连接问题')
      console.log('3. 用户认证问题')
      return
    }

    // 2. 显示每个会话的详细信息
    sessions.forEach((session, index) => {
      console.log(`\n会话 ${index + 1}:`)
      console.log(`  ID: ${session.id}`)
      console.log(`  标题: ${session.title || '(无标题)'}`)
      console.log(`  用户: ${session.user.username || session.user.phone || session.userId}`)
      console.log(`  消息数量: ${session.messages.length}`)
      console.log(`  创建时间: ${session.createdAt}`)
      console.log(`  更新时间: ${session.updatedAt}`)
      
      if (session.messages.length > 0) {
        console.log(`  消息列表:`)
        session.messages.forEach((msg, msgIndex) => {
          const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
          console.log(`    ${msgIndex + 1}. [${msg.role}] ${preview}`)
        })
      } else {
        console.log(`  ⚠️  此会话没有消息！`)
      }
    })

    // 3. 检查所有消息
    const allMessages = await prisma.chatMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    console.log(`\n\n最近 10 条消息:`)
    allMessages.forEach((msg, index) => {
      const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
      console.log(`  ${index + 1}. [${msg.role}] ${preview} (会话: ${msg.chatId})`)
    })

    // 4. 统计信息
    const totalMessages = await prisma.chatMessage.count()
    const sessionsWithMessages = sessions.filter(s => s.messages.length > 0).length
    const sessionsWithoutMessages = sessions.filter(s => s.messages.length === 0).length

    console.log(`\n\n统计信息:`)
    console.log(`  总会话数: ${sessions.length}`)
    console.log(`  有消息的会话: ${sessionsWithMessages}`)
    console.log(`  无消息的会话: ${sessionsWithoutMessages}`)
    console.log(`  总消息数: ${totalMessages}`)

    if (sessionsWithoutMessages > 0) {
      console.log(`\n⚠️  警告: 有 ${sessionsWithoutMessages} 个会话没有消息！`)
      console.log(`这些会话可能是:`)
      console.log(`1. 刚创建但还没有发送消息`)
      console.log(`2. 消息保存失败`)
    }

  } catch (error) {
    console.error('检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkChatData()

