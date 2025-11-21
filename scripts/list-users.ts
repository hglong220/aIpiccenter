
import { prisma } from '../lib/prisma'

async function main() {
    console.log('Checking users...')
    try {
        const users = await prisma.user.findMany()
        console.log('Users found:', users.length)
        console.log('First user:', users[0])
    } catch (error) {
        console.error('Error listing users:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
