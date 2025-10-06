import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get total active loans
    const activeLoans = await db.loan.count({
      where: {
        status: 'AKTIF'
      }
    })

    // Get total active loans amount
    const totalActiveLoansAmount = await db.loan.aggregate({
      where: {
        status: 'AKTIF'
      },
      _sum: {
        nilaiPinjaman: true
      }
    })

    // Get this month's redemptions
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const monthlyRedemptions = await db.transaction.aggregate({
      where: {
        jenisTransaksi: 'TEBUS',
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        totalBayar: true
      },
      _count: true
    })

    // Calculate profit (sum of all potongan and denda)
    const profit = await db.transaction.aggregate({
      _sum: {
        denda: true
      }
    })

    const totalPotongan = await db.loan.aggregate({
      _sum: {
        potongan: true
      }
    })

    const totalProfit = (profit._sum.denda || 0) + (totalPotongan._sum.potongan || 0)

    // Get recent transactions
    const recentTransactions = await db.transaction.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        nasabah: {
          select: {
            nama: true
          }
        }
      }
    })

    // Get expiring loans (within 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const expiringLoans = await db.loan.findMany({
      where: {
        status: 'AKTIF',
        jatuhTempo: {
          lte: sevenDaysFromNow
        }
      },
      include: {
        nasabah: {
          select: {
            nama: true
          }
        }
      },
      orderBy: {
        jatuhTempo: 'asc'
      },
      take: 10
    })

    return NextResponse.json({
      stats: {
        totalActiveLoans: activeLoans,
        totalActiveLoansAmount: totalActiveLoansAmount._sum.nilaiPinjaman || 0,
        monthlyRedemptions: {
          count: monthlyRedemptions._count,
          amount: monthlyRedemptions._sum.totalBayar || 0
        },
        totalProfit: totalProfit
      },
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.transactionID,
        customerName: tx.nasabah.nama,
        type: tx.jenisTransaksi,
        amount: tx.totalBayar,
        date: tx.tanggal,
        status: 'completed'
      })),
      expiringLoans: expiringLoans.map(loan => {
        const daysLeft = Math.ceil((loan.jatuhTempo.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return {
          loanId: loan.loanID,
          customerName: loan.nasabah.nama,
          barang: loan.barang,
          nilaiPinjaman: loan.nilaiPinjaman,
          jatuhTempo: loan.jatuhTempo,
          daysLeft
        }
      })
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}