import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to calculate denda
function calculateDenda(nilaiPinjaman: number, jatuhTempo: Date, tanggalBayar: Date = new Date()): number {
  if (tanggalBayar <= jatuhTempo) {
    return 0
  }
  
  const diffTime = Math.abs(tanggalBayar.getTime() - jatuhTempo.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const periods15Days = Math.ceil(diffDays / 15)
  
  return nilaiPinjaman * 0.05 * periods15Days // 5% per 15 days
}

// GET all transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    
    const transactions = await db.transaction.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { transactionID: { contains: search } },
              { loanID: { contains: search } },
              { customerID: { contains: search } },
              { nasabah: { nama: { contains: search } } }
            ]
          } : {},
          type && type !== 'all' ? { jenisTransaksi: type as any } : {}
        ]
      },
      include: {
        loan: {
          select: {
            barang: true,
            nilaiPinjaman: true,
            jatuhTempo: true,
            status: true
          }
        },
        nasabah: {
          select: {
            nama: true,
            noHP: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Transaksi GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanID, jenisTransaksi, metodePembayaran = 'CASH' } = body

    // Get loan details
    const loan = await db.loan.findUnique({
      where: { loanID },
      include: {
        nasabah: true
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (loan.status !== 'AKTIF') {
      return NextResponse.json(
        { error: 'Loan tidak aktif' },
        { status: 400 }
      )
    }

    const transactionID = `TRX${Date.now()}`
    let denda = 0
    let totalBayar = 0
    let jumlah = 0

    if (jenisTransaksi === 'TEBUS') {
      // Calculate denda if overdue
      denda = calculateDenda(loan.nilaiPinjaman, loan.jatuhTempo)
      totalBayar = loan.nilaiPinjaman + denda
      jumlah = totalBayar

      // Update loan status
      await db.loan.update({
        where: { loanID },
        data: { status: 'TEBUS' }
      })

      // Update inventory status
      await db.inventory.update({
        where: { loanID },
        data: { status: 'TERTEBUS' }
      })

    } else if (jenisTransaksi === 'PERPANJANG') {
      // Calculate extension fee (10%)
      jumlah = loan.nilaiPinjaman * 0.1
      totalBayar = jumlah
      denda = 0

      // Update jatuh tempo (+1 month)
      const newJatuhTempo = new Date(loan.jatuhTempo)
      newJatuhTempo.setMonth(newJatuhTempo.getMonth() + 1)

      await db.loan.update({
        where: { loanID },
        data: { jatuhTempo: newJatuhTempo }
      })
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        transactionID,
        loanID,
        customerID: loan.customerID,
        jenisTransaksi,
        jumlah,
        denda,
        totalBayar,
        metodePembayaran: metodePembayaran.toUpperCase(),
        tanggal: new Date()
      },
      include: {
        loan: {
          select: {
            barang: true,
            nilaiPinjaman: true,
            jatuhTempo: true,
            status: true
          }
        },
        nasabah: {
          select: {
            nama: true,
            noHP: true
          }
        }
      }
    })

    // Create cash flow record
    await db.cashFlow.create({
      data: {
        transactionID,
        jenis: jenisTransaksi === 'TEBUS' ? 'MASUK' : 'MASUK',
        jumlah: totalBayar,
        sumberDana: metodePembayaran.toUpperCase(),
        keterangan: `${jenisTransaksi} ${loanID} - ${loan.nasabah.nama}`
      }
    })

    console.log('Transaction created:', {
      transactionID,
      jenisTransaksi,
      totalBayar,
      metodePembayaran,
      loanID
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaksi POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET active loans for transaction
export async function GET_ACTIVE_LOANS() {
  try {
    const activeLoans = await db.loan.findMany({
      where: {
        status: 'AKTIF'
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
      }
    })

    return NextResponse.json(activeLoans)
  } catch (error) {
    console.error('Active Loans GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}