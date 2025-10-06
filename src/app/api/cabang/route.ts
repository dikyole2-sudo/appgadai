import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all cabang
export async function GET(request: NextRequest) {
  try {
    const cabangs = await db.cabang.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(cabangs)
  } catch (error) {
    console.error('Cabang GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new cabang
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, alamat, telepon, status } = body

    if (!nama || !alamat || !telepon || !status) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const cabang = await db.cabang.create({
      data: {
        nama,
        alamat,
        telepon,
        status
      }
    })

    return NextResponse.json(cabang)
  } catch (error) {
    console.error('Cabang POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update cabang
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nama, alamat, telepon, status } = body

    if (!id || !nama || !alamat || !telepon || !status) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if cabang exists
    const existingCabang = await db.cabang.findUnique({
      where: { id }
    })

    if (!existingCabang) {
      return NextResponse.json(
        { error: 'Cabang not found' },
        { status: 404 }
      )
    }

    const cabang = await db.cabang.update({
      where: { id },
      data: {
        nama,
        alamat,
        telepon,
        status
      }
    })

    return NextResponse.json(cabang)
  } catch (error) {
    console.error('Cabang PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE cabang
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Cabang ID is required' },
        { status: 400 }
      )
    }

    // Check if cabang exists
    const existingCabang = await db.cabang.findUnique({
      where: { id }
    })

    if (!existingCabang) {
      return NextResponse.json(
        { error: 'Cabang not found' },
        { status: 404 }
      )
    }

    await db.cabang.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Cabang deleted successfully' })
  } catch (error) {
    console.error('Cabang DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}