"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Package,
  Calendar,
  Calculator
} from "lucide-react"

interface Loan {
  id: string
  loanID: string
  customerID: string
  barang: string
  nilaiPinjaman: number
  potongan: number
  netCair: number
  tanggalGadai: string
  jatuhTempo: string
  status: "AKTIF" | "TEBUS" | "DILELANG"
  createdAt: string
  updatedAt: string
  nasabah?: {
    nama: string
    noHP: string
  }
}

export default function BarangPage() {
  const [loanList, setLoanList] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerID: "",
    barang: "",
    nilaiPinjaman: "",
    tanggalGadai: ""
  })

  // Fetch loans data
  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/barang')
      if (response.ok) {
        const data = await response.json()
        setLoanList(data)
      } else {
        toast.error('Gagal mengambil data barang gadai')
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
      toast.error('Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  // Calculate potongan and netCair automatically
  const calculateLoan = (nilaiPinjaman: number) => {
    const potongan = nilaiPinjaman * 0.1 // 10%
    const netCair = nilaiPinjaman - potongan
    return { potongan, netCair }
  }

  // Calculate jatuh tempo (tanggal gadai + 1 bulan)
  const calculateJatuhTempo = (tanggalGadai: string) => {
    const date = new Date(tanggalGadai)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split('T')[0]
  }

  // Generate next Loan ID
  const generateLoanID = () => {
    const maxId = loanList.reduce((max, loan) => {
      const num = parseInt(loan.loanID.replace('H', ''))
      return num > max ? num : max
    }, 0)
    return `H${String(maxId + 1).padStart(3, '0')}`
  }

  const handleNilaiPinjamanChange = (value: string) => {
    setFormData(prev => ({ ...prev, nilaiPinjaman: value }))
  }

  const handleTanggalGadaiChange = (value: string) => {
    setFormData(prev => ({ ...prev, tanggalGadai: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/barang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Barang gadai berhasil ditambahkan')
        await fetchLoans()
        
        // Trigger global refresh for cash flow
        fetch('/api/cash').catch(() => {})
        
        // Reset form
        setFormData({
          customerID: "",
          barang: "",
          nilaiPinjaman: "",
          tanggalGadai: ""
        })
        setIsAddDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan data')
      }
    } catch (error) {
      console.error('Error saving loan:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const filteredLoans = loanList.filter(loan => {
    const matchesSearch = 
      loan.loanID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.nasabah?.nama.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || loan.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Get calculated values for preview
  const nilaiPinjamanNum = parseFloat(formData.nilaiPinjaman) || 0
  const { potongan: calculatedPotongan, netCair: calculatedNetCair } = calculateLoan(nilaiPinjamanNum)
  const calculatedJatuhTempo = formData.tanggalGadai ? calculateJatuhTempo(formData.tanggalGadai) : ""

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Data Barang Gadai</h2>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Data Barang Gadai</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Barang Gadai
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Barang Gadai Baru</DialogTitle>
              <DialogDescription>
                Tambahkan barang gadai baru dengan perhitungan otomatis
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerID">Customer ID</Label>
                  <Input
                    id="customerID"
                    value={formData.customerID}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerID: e.target.value }))}
                    placeholder="Contoh: BS2192"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalGadai">Tanggal Gadai</Label>
                  <Input
                    id="tanggalGadai"
                    type="date"
                    value={formData.tanggalGadai}
                    onChange={(e) => handleTanggalGadaiChange(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barang">Deskripsi Barang</Label>
                <Textarea
                  id="barang"
                  value={formData.barang}
                  onChange={(e) => setFormData(prev => ({ ...prev, barang: e.target.value }))}
                  placeholder="Contoh: Emas 22K 10gr, Laptop MacBook Pro 2020"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nilaiPinjaman">Nilai Pinjaman</Label>
                <Input
                  id="nilaiPinjaman"
                  type="number"
                  value={formData.nilaiPinjaman}
                  onChange={(e) => handleNilaiPinjamanChange(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              
              {/* Preview Calculations */}
              {nilaiPinjamanNum > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Calculator className="mr-2 h-4 w-4" />
                      Perhitungan Otomatis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Potongan (10%):</span>
                      <span className="font-medium">{formatCurrency(calculatedPotongan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Cair:</span>
                      <span className="font-medium text-green-600">{formatCurrency(calculatedNetCair)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jatuh Tempo:</span>
                      <span className="font-medium">{formatDate(calculatedJatuhTempo)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={!formData.customerID || !formData.barang || !formData.nilaiPinjaman || !formData.tanggalGadai}>
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Barang Gadai</CardTitle>
          <CardDescription>
            Kelola data barang yang digadaikan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari barang gadai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="TEBUS">Tebus</SelectItem>
                <SelectItem value="DILELANG">Lelang</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Customer ID</TableHead>
                <TableHead>Nama Nasabah</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead>Nilai Pinjaman</TableHead>
                <TableHead>Net Cair</TableHead>
                <TableHead>Tanggal Gadai</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.loanID}</TableCell>
                  <TableCell>{loan.customerID}</TableCell>
                  <TableCell>{loan.nasabah?.nama || "-"}</TableCell>
                  <TableCell>{loan.barang}</TableCell>
                  <TableCell>{formatCurrency(loan.nilaiPinjaman)}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(loan.netCair)}
                  </TableCell>
                  <TableCell>{formatDate(loan.tanggalGadai)}</TableCell>
                  <TableCell>{formatDate(loan.jatuhTempo)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      loan.status === "AKTIF" ? "default" :
                      loan.status === "TEBUS" ? "secondary" : "destructive"
                    }>
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}