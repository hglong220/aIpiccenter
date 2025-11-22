import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
    console.log('🔍 验证管理员密码...\n')

    try {
        // 查找 admin 用户
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: 'admin' },
                    { phone: '13000000000' },
                ],
            },
        })

        if (!user) {
            console.log('❌ 未找到管理员用户')
            return
        }

        console.log('✅ 找到用户:')
        console.log(`   ID: ${user.id}`)
        console.log(`   用户名: ${user.username}`)
        console.log(`   手机号: ${user.phone}`)
        console.log(`   权限: ${user.plan}`)
        console.log(`   密码哈希: ${user.password.substring(0, 20)}...`)
        console.log('')

        // 测试密码
        const testPasswords = ['admin123', 'Admin123', 'admin', '123456']

        console.log('🔐 测试常用密码...\n')

        for (const pwd of testPasswords) {
            const isValid = await bcrypt.compare(pwd, user.password)
            console.log(`   密码 "${pwd}": ${isValid ? '✅ 正确' : '❌ 错误'}`)
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // 如果所有测试密码都不对，重置密码
        const correctPassword = await bcrypt.compare('admin123', user.password)

        if (!correctPassword) {
            console.log('\n⚠️  密码不匹配！正在重置密码为 "admin123"...\n')

            const newHashedPassword = await bcrypt.hash('admin123', 10)

            await prisma.user.update({
                where: { id: user.id },
                data: { password: newHashedPassword },
            })

            console.log('✅ 密码已重置为: admin123')
            console.log('\n🎯 现在可以使用以下信息登录:')
            console.log(`   用户名: ${user.username}`)
            console.log(`   密码: admin123`)
        } else {
            console.log('\n✅ 密码验证通过！')
            console.log('\n🎯 登录信息:')
            console.log(`   用户名: ${user.username}`)
            console.log(`   或手机号: ${user.phone}`)
            console.log('   密码: admin123')
        }

    } catch (error) {
        console.error('❌ 错误:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
