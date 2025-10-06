import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function seedDefaultData() {
  try {
    console.log('Seeding default data...')
    
    // Add default branch
    const cabang = await db.cabang.create({
      data: {
        nama: 'Cabang Pusat',
        alamat: 'Jl. Sudirman No. 123, Jakarta Pusat',
        telepon: '021-1234567',
        status: 'AKTIF'
      }
    })
    console.log('✅ Default branch created:', cabang.nama)
    
    console.log('🎉 Default data seeding completed!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the seeding
seedDefaultData()
  .then(() => {
    console.log('✨ System is now ready for use!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })