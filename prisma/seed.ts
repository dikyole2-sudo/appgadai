import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mandirigadai.id' },
    update: {},
    create: {
      email: 'admin@mandirigadai.id',
      nama: 'Administrator',
      password: 'admin123',
      role: 'ADMIN',
    },
  })

  // Create default kasir user
  const kasirUser = await prisma.user.upsert({
    where: { email: 'kasir@mandirigadai.id' },
    update: {},
    create: {
      email: 'kasir@mandirigadai.id',
      nama: 'Kasir',
      password: 'kasir123',
      role: 'KASIR',
    },
  })

  // Create default branch
  const cabangPusat = await prisma.cabang.upsert({
    where: { id: 'cabang-pusat' },
    update: {},
    create: {
      id: 'cabang-pusat',
      nama: 'Cabang Pusat',
      alamat: 'Jl. Sudirman No. 123, Jakarta Pusat',
      telepon: '021-1234567',
      status: 'AKTIF',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Admin user:', adminUser)
  console.log('Kasir user:', kasirUser)
  console.log('Cabang:', cabangPusat)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })