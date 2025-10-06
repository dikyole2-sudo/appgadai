import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all inventory items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    const inventory = await db.inventory.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { loanID: { contains: search } },
              { customerID: { contains: search } },
              { barang: { contains: search } },
              { loan: { nasabah: { nama: { contains: search } } } }
            ]
          } : {},
          status && status !== 'all' ? { status: status as any } : {}
        ]
      },
      include: {
        loan: {
          include: {
            nasabah: {
              select: {
                nama: true,
                noHP: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update inventory item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, kondisi, status } = body

    const inventory = await db.inventory.update({
      where: { id },
      data: {
        kondisi,
        status,
        updatedAt: new Date()
      },
      include: {
        loan: {
          include: {
            nasabah: {
              select: {
                nama: true,
                noHP: true
              }
            }
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