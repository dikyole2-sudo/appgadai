import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT update inventory item by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { kondisi, status } = body
    const { id } = params

    const inventory = await db.inventory.update({
      where: { id },
      data: {
        kondisi,
        status,
        updatedAt: new Date()
      },
      include: {
        loan: {
          select: {
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

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Inventory PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}