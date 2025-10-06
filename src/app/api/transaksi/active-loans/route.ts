import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET active loans for transaction
export async function GET() {
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