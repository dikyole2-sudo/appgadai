import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all cash flow records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const jenis = searchParams.get('jenis')
    const sumber = searchParams.get('sumber')
    
    const cashFlow = await db.cashFlow.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { keterangan: { contains: search } },
              { transactionID: { contains: search } },
              { transaction: { nasabah: { nama: { contains: search } } } }
            ]
          } : {},
          jenis && jenis !== 'all' ? { jenis: jenis as any } : {},
          sumber && sumber !== 'all' ? { sumberDana: sumber as any } : {}
        ]
      },
      include: {
        transaction: {
          select: {
            transactionID: true,
            jenisTransaksi: true,
            nasabah: {
              select: {
                nama: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(cashFlow)
  } catch (error) {
    console.error('Cash GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new cash flow record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jenis, jumlah, sumberDana, keterangan } = body

    // Convert jumlah to number
    const jumlahNum = parseFloat(jumlah)
    if (isNaN(jumlahNum)) {
      return NextResponse.json(
        { error: 'Jumlah harus berupa angka' },
        { status: 400 }
      )
    }

    const cashFlow = await db.cashFlow.create({
      data: {
        jenis,
        jumlah: jumlahNum,
        sumberDana,
        keterangan,
        tanggal: new Date()
      }
    })

    return NextResponse.json(cashFlow)
  } catch (error) {
    console.error('Cash POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}