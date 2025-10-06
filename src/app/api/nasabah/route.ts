import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all nasabah
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    const nasabah = await db.nasabah.findMany({
      where: search ? {
        OR: [
          { nama: { contains: search } },
          { customerID: { contains: search } },
          { noHP: { contains: search } }
        ]
      } : {},
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(nasabah)
  } catch (error) {
    console.error('Nasabah GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new nasabah
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, jenisKelamin, ktp, alamat, noHP, pekerjaan, sumberInfo } = body

    // Generate CustomerID
    const namaDepan = nama.split(' ')[0].substring(0, 2).toUpperCase()
    const hpLast4 = noHP.slice(-4)
    const customerID = `${namaDepan}${hpLast4}`

    // Check if CustomerID already exists
    const existingCustomer = await db.nasabah.findUnique({
      where: { customerID }
    })

    if (existingCustomer) {
      // If exists, add random number
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const newCustomerID = `${namaDepan}${hpLast4}${randomNum}`
      
      const nasabah = await db.nasabah.create({
        data: {
          customerID: newCustomerID,
          nama,
          jenisKelamin,
          ktp,
          alamat,
          noHP,
          pekerjaan,
          sumberInfo
        }
      })
      
      return NextResponse.json(nasabah)
    }

    const nasabah = await db.nasabah.create({
      data: {
        customerID,
        nama,
        jenisKelamin,
        ktp,
        alamat,
        noHP,
        pekerjaan,
        sumberInfo
      }
    })

    return NextResponse.json(nasabah)
  } catch (error) {
    console.error('Nasabah POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}