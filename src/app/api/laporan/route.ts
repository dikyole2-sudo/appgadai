import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'harian'
    const timeRange = searchParams.get('timeRange') || 'bulan-ini'
    
    // Calculate date range based on timeRange
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case 'hari-ini':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'minggu-ini':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'bulan-ini':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'tahun-ini':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get transaction data
    const transactions = await db.transaction.findMany({
      where: {
        tanggal: {
          gte: startDate
        }
      },
      include: {
        nasabah: {
          select: {
            nama: true,
            jenisKelamin: true,
            pekerjaan: true,
            sumberInfo: true
          }
        }
      }
    })

    // Get loan data
    const loans = await db.loan.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        nasabah: {
          select: {
            nama: true,
            jenisKelamin: true,
            pekerjaan: true,
            sumberInfo: true
          }
        }
      }
    })

    // Calculate totals
    const totalPinjaman = transactions
      .filter(t => t.jenisTransaksi === 'PINJAM')
      .reduce((sum, t) => sum + t.jumlah, 0)
    
    const totalDenda = transactions.reduce((sum, t) => sum + t.denda, 0)
    const totalTebusan = transactions
      .filter(t => t.jenisTransaksi === 'TEBUS')
      .reduce((sum, t) => sum + t.jumlah, 0)
    
    const totalLabaBersih = totalDenda + (totalTebusan * 0.1) // Assuming 10% margin on tebusan
    
    const jumlahNasabah = await db.nasabah.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })
    
    const jumlahBarangAktif = await db.loan.count({
      where: {
        status: 'AKTIF'
      }
    })

    // Get gender statistics
    const genderStats = await db.nasabah.groupBy({
      by: ['jenisKelamin'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        jenisKelamin: true
      }
    })

    // Get occupation statistics
    const occupationStats = await db.nasabah.groupBy({
      by: ['pekerjaan'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        pekerjaan: true
      }
    })

    // Get info source statistics
    const infoSourceStats = await db.nasabah.groupBy({
      by: ['sumberInfo'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        sumberInfo: true
      }
    })

    // Get monthly trend data (for last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthTransactions = await db.transaction.findMany({
        where: {
          tanggal: {
            gte: monthDate,
            lt: nextMonth
          }
        }
      })
      
      const monthPinjaman = monthTransactions
        .filter(t => t.jenisTransaksi === 'PINJAM')
        .reduce((sum, t) => sum + t.jumlah, 0)
      
      const monthTebusan = monthTransactions
        .filter(t => t.jenisTransaksi === 'TEBUS')
        .reduce((sum, t) => sum + t.jumlah, 0)
      
      const monthDenda = monthTransactions.reduce((sum, t) => sum + t.denda, 0)
      
      monthlyTrend.push({
        bulan: monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        totalPinjaman: monthPinjaman,
        totalTebusan: monthTebusan,
        totalDenda: monthDenda,
        labaBersih: monthDenda + (monthTebusan * 0.1)
      })
    }

    const reportData = {
      totalPinjaman,
      totalDenda,
      totalTebusan,
      totalLabaBersih,
      jumlahNasabah,
      jumlahBarangAktif,
      genderStats,
      occupationStats,
      infoSourceStats,
      monthlyTrend,
      detailedTransactions: transactions.slice(0, 100) // Limit to 100 for performance
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Report GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}