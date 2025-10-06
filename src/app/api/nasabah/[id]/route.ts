import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT update nasabah
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, jenisKelamin, ktp, alamat, noHP, pekerjaan, sumberInfo } = body

    const nasabah = await db.nasabah.update({
      where: { id: params.id },
      data: {
        nama,
        jenisKelamin,
        ktp,
        alamat,
        noHP,
        pekerjaan,
        sumberInfo,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(nasabah)
  } catch (error) {
    console.error('Nasabah PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE nasabah
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.nasabah.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Nasabah deleted successfully' })
  } catch (error) {
    console.error('Nasabah DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}