import { prisma } from '../lib/prisma'

async function main() {
    console.log('📋 查询所有用户信息...\n')
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                phone: true,
                email: true,
                plan: true,
                credits: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        if (users.length === 0) {
            console.log('❌ 没有找到任何用户')
            return
        }

        console.log(`✅ 找到 ${users.length} 个用户:\n`)

        users.forEach((user, index) => {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`用户 #${index + 1}`)
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`  ID:       ${user.id}`)
            console.log(`  用户名:   ${user.username || '(未设置)'}`)
            console.log(`  手机号:   ${user.phone}`)
            console.log(`  邮箱:     ${user.email || '(未设置)'}`)
            console.log(`  权限:     ${user.plan}`)
            console.log(`  积分:     ${user.credits}`)
            console.log(`  创建时间: ${user.createdAt.toLocaleString('zh-CN')}`)
            console.log(`  更新时间: ${user.updatedAt.toLocaleString('zh-CN')}`)

            if (user.plan === 'admin') {
                console.log(`\n  🔑 管理员登录信息:`)
                console.log(`     用户名: ${user.username}`)
                console.log(`     手机号: ${user.phone}`)
                console.log(`     密码:   admin123 (默认密码)`)
            }
            console.log('')
        })

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

        const adminUsers = users.filter(u => u.plan === 'admin')
        if (adminUsers.length > 0) {
            console.log('🎯 管理员账号登录步骤:')
            console.log('   1. 访问 http://localhost:3000/')
            console.log('   2. 选择"密码登录"')
            console.log(`   3. 用户名: ${adminUsers[0].username}`)
            console.log(`      或手机号: ${adminUsers[0].phone}`)
            console.log('   4. 密码: admin123')
            console.log('   5. 登录后访问 http://localhost:3000/admin\n')
        }
    } catch (error) {
        console.error('❌ 查询用户失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
