import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function clearAllData() {
  try {
    console.log('Starting database cleanup...')
    
    // Delete in correct order to respect foreign key constraints
    // Start from tables with no dependencies or at the bottom of the hierarchy
    
    // 1. Delete CashFlow first (depends on Transaction)
    await db.cashFlow.deleteMany()
    console.log('✅ CashFlow records deleted')
    
    // 2. Delete Transactions (depends on Loan and Nasabah)
    await db.transaction.deleteMany()
    console.log('✅ Transaction records deleted')
    
    // 3. Delete Inventory (depends on Loan)
    await db.inventory.deleteMany()
    console.log('✅ Inventory records deleted')
    
    // 4. Delete Loans (depends on Nasabah)
    await db.loan.deleteMany()
    console.log('✅ Loan records deleted')
    
    // 5. Delete Customers (no dependencies after loans are deleted)
    await db.nasabah.deleteMany()
    console.log('✅ Customer records deleted')
    
    // 6. Delete Branches (no dependencies)
    await db.cabang.deleteMany()
    console.log('✅ Branch records deleted')
    
    console.log('🎉 Database cleanup completed successfully!')
    
    // Verify counts
    const counts = await Promise.all([
      db.nasabah.count(),
      db.loan.count(),
      db.transaction.count(),
      db.inventory.count(),
      db.cashFlow.count(),
      db.cabang.count()
    ])
    
    console.log('\n📊 Final record counts:')
    console.log(`Customers: ${counts[0]}`)
    console.log(`Loans: ${counts[1]}`)
    console.log(`Transactions: ${counts[2]}`)
    console.log(`Inventory: ${counts[3]}`)
    console.log(`CashFlow: ${counts[4]}`)
    console.log(`Branches: ${counts[5]}`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the cleanup
clearAllData()
  .then(() => {
    console.log('✨ Database is now ready for fresh start!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error)
    process.exit(1)
  })