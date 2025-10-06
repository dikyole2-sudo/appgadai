import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'bulanan'
    const timeRange = searchParams.get('timeRange') || 'bulan-ini'
    const format = searchParams.get('format') || 'excel'

    // Calculate date range based on timeRange
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) // End of current month

    switch (timeRange) {
      case 'hari-ini':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'minggu-ini':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0)
        break
      case 'bulan-ini':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        break
      case 'tahun-ini':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    }

    // Fetch comprehensive report data
    const [
      totalPinjamanResult,
      totalDendaResult,
      totalTebusanResult,
      nasabahCount,
      barangAktifCount,
      genderStats,
      occupationStats,
      infoSourceStats,
      transactions
    ] = await Promise.all([
      // Total pinjaman (sum of all loan amounts)
      db.loan.aggregate({
        _sum: { jumlahPinjaman: true },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Total denda from transactions
      db.transaction.aggregate({
        _sum: { denda: true },
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Total tebusan (sum of redemption payments)
      db.transaction.aggregate({
        _sum: { totalBayar: true },
        where: {
          jenisTransaksi: 'TEBUS',
          tanggal: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Count unique customers
      db.customer.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Count active loans
      db.loan.count({
        where: {
          status: 'AKTIF'
        }
      }),
      
      // Gender statistics
      db.customer.groupBy({
        by: ['jenisKelamin'],
        _count: { jenisKelamin: true },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Occupation statistics
      db.customer.groupBy({
        by: ['pekerjaan'],
        _count: { pekerjaan: true },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Info source statistics
      db.customer.groupBy({
        by: ['sumberInfo'],
        _count: { sumberInfo: true },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Detailed transactions with customer info
      db.transaction.findMany({
        include: {
          customer: {
            select: { nama: true }
          }
        },
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { tanggal: 'desc' },
        take: 100
      })
    ])

    // Calculate monthly trend if type is bulanan
    let monthlyTrend = []
    if (type === 'bulanan') {
      const monthlyData = await db.$queryRaw`
        SELECT 
          strftime('%Y-%m', tanggal) as bulan,
          SUM(CASE WHEN jenisTransaksi = 'BARU' THEN jumlah ELSE 0 END) as totalPinjaman,
          SUM(CASE WHEN jenisTransaksi = 'TEBUS' THEN totalBayar ELSE 0 END) as totalTebusan,
          SUM(denda) as totalDenda,
          SUM(totalBayar) - SUM(CASE WHEN jenisTransaksi = 'BARU' THEN jumlah ELSE 0 END) as labaBersih
        FROM Transaction 
        WHERE tanggal >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', tanggal)
        ORDER BY bulan DESC
        LIMIT 12
      `
      monthlyTrend = monthlyData
    }

    const totalPinjaman = totalPinjamanResult._sum.jumlahPinjaman || 0
    const totalDenda = totalDendaResult._sum.denda || 0
    const totalTebusan = totalTebusanResult._sum.totalBayar || 0
    const totalLabaBersih = totalTebusan - totalPinjaman

    const reportData = {
      totalPinjaman,
      totalDenda,
      totalTebusan,
      totalLabaBersih,
      jumlahNasabah: nasabahCount,
      jumlahBarangAktif: barangAktifCount,
      genderStats,
      occupationStats,
      infoSourceStats,
      monthlyTrend,
      detailedTransactions: transactions.map(t => ({
        ...t,
        nasabah: t.customer
      }))
    }

    if (format === 'excel') {
      // Return data for Excel generation
      return NextResponse.json(reportData)
    } else {
      // Return data for PDF generation
      return NextResponse.json(reportData)
    }

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export data' },
      { status: 500 }
    )
  }
}