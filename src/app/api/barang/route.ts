import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all loans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    const loans = await db.loan.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { loanID: { contains: search } },
              { customerID: { contains: search } },
              { barang: { contains: search } },
              { nasabah: { nama: { contains: search } } }
            ]
          } : {},
          status && status !== 'all' ? { status: status as any } : {}
        ]
      },
      include: {
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

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Barang GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new loan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerID, barang, nilaiPinjaman, tanggalGadai } = body

    // Convert nilaiPinjaman to number
    const nilaiPinjamanNum = parseFloat(nilaiPinjaman)
    if (isNaN(nilaiPinjamanNum)) {
      return NextResponse.json(
        { error: 'Nilai pinjaman harus berupa angka' },
        { status: 400 }
      )
    }

    // Calculate potongan and netCair
    const potongan = nilaiPinjamanNum * 0.1 // 10%
    const netCair = nilaiPinjamanNum - potongan

    // Calculate jatuh tempo (tanggal gadai + 1 month)
    const gadaiDate = new Date(tanggalGadai)
    const jatuhTempo = new Date(gadaiDate)
    jatuhTempo.setMonth(jatuhTempo.getMonth() + 1)

    // Generate Loan ID
    const lastLoan = await db.loan.findFirst({
      orderBy: {
        loanID: 'desc'
      }
    })

    let loanNumber = 1
    if (lastLoan) {
      const lastNumber = parseInt(lastLoan.loanID.replace('H', ''))
      loanNumber = lastNumber + 1
    }
    const loanID = `H${String(loanNumber).padStart(3, '0')}`

    // Check if customer exists
    const customer = await db.nasabah.findUnique({
      where: { customerID }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer ID tidak ditemukan' },
        { status: 400 }
      )
    }

    console.log('Creating loan with data:', {
      loanID,
      customerID,
      barang,
      nilaiPinjaman: nilaiPinjamanNum,
      potongan,
      netCair,
      tanggalGadai: gadaiDate,
      jatuhTempo,
      status: 'AKTIF'
    })

    const loan = await db.loan.create({
      data: {
        loanID,
        customerID,
        barang,
        nilaiPinjaman: nilaiPinjamanNum,
        potongan,
        netCair,
        tanggalGadai: gadaiDate,
        jatuhTempo,
        status: 'AKTIF'
      },
      include: {
        nasabah: {
          select: {
            nama: true,
            noHP: true
          }
        }
      }
    })

    // Create inventory record
    await db.inventory.create({
      data: {
        loanID,
        customerID,
        barang,
        kondisi: "Baik",
        status: 'DITAHAN',
        tanggalMasuk: gadaiDate
      }
    })

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        transactionID: `TRX${Date.now()}`,
        loanID,
        customerID,
        jenisTransaksi: 'PINJAM',
        jumlah: netCair,
        denda: 0,
        totalBayar: netCair,
        metodePembayaran: 'CASH',
        tanggal: new Date()
      }
    })

    // Create cash flow record
    await db.cashFlow.create({
      data: {
        transactionID: transaction.transactionID,
        jenis: 'KELUAR',
        jumlah: netCair,
        sumberDana: 'CASH',
        keterangan: `Pencairan gadai ${loanID} - ${customer.nama}`
      }
    })

    console.log('Loan created with cash flow:', {
      loanID,
      netCair,
      transactionID: transaction.transactionID,
      customerName: customer.nama
    })

    return NextResponse.json(loan)
  } catch (error) {
    console.error('Barang POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}