const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 10)
  try {
    const user = await prisma.user.update({
      where: { email: 'admin@reachflow.com' },
      data: { password: hash }
    })
    console.log('Password updated:', user.email)
  } catch (e) {
    const user = await prisma.user.create({
      data: { name: 'Admin', email: 'admin@reachflow.com', password: hash, role: 'ADMIN' }
    })
    console.log('Admin created:', user.email)
  }
  await prisma.$disconnect()
}

main().catch(console.error)

