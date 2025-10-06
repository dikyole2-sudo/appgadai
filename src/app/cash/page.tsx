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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar
} from "lucide-react"

interface CashFlow {
  id: string
  transactionID?: string
  jenis: "MASUK" | "KELUAR"
  jumlah: number
  sumberDana: "CASH" | "BANK"
  keterangan: string
  tanggal: string
  createdAt: string
  transaction?: {
    transactionID: string
    jenisTransaksi: string
    nasabah?: {
      nama: string
    }
  }
}

export default function CashPage() {
  const [cashFlowList, setCashFlowList] = useState<CashFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [jenisFilter, setJenisFilter] = useState<string>("all")
  const [sumberFilter, setSumberFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    jenis: "",
    jumlah: "",
    sumberDana: "",
    keterangan: ""
  })

  // Fetch cash flow data
  const fetchCashFlow = async () => {
    try {
      const response = await fetch('/api/cash')
      if (response.ok) {
        const data = await response.json()
        setCashFlowList(data)
      } else {
        toast.error('Gagal mengambil data cash flow')
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
      toast.error('Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCashFlow()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Catat kas berhasil ditambahkan')
        await fetchCashFlow()
        
        // Reset form
        setFormData({
          jenis: "",
          jumlah: "",
          sumberDana: "",
          keterangan: ""
        })
        setIsAddDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan data')
      }
    } catch (error) {
      console.error('Error saving cash flow:', error)
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

  const filteredCashFlow = cashFlowList.filter(cash => {
    const matchesSearch = 
      cash.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cash.transactionID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cash.transaction?.nasabah?.nama.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesJenis = jenisFilter === "all" || cash.jenis === jenisFilter
    const matchesSumber = sumberFilter === "all" || cash.sumberDana === sumberFilter
    
    return matchesSearch && matchesJenis && matchesSumber
  })

  // Calculate statistics separated by source
  const totalMasukCash = cashFlowList
    .filter(cash => cash.jenis === "MASUK" && cash.sumberDana === "CASH")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const totalMasukBank = cashFlowList
    .filter(cash => cash.jenis === "MASUK" && cash.sumberDana === "BANK")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const totalKeluarCash = cashFlowList
    .filter(cash => cash.jenis === "KELUAR" && cash.sumberDana === "CASH")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const totalKeluarBank = cashFlowList
    .filter(cash => cash.jenis === "KELUAR" && cash.sumberDana === "BANK")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const totalMasuk = totalMasukCash + totalMasukBank
  const totalKeluar = totalKeluarCash + totalKeluarBank
  const netCash = totalMasukCash - totalKeluarCash
  const netBank = totalMasukBank - totalKeluarBank
  const netTotal = netCash + netBank

  // Get today's cash flow separated by source
  const today = new Date().toDateString()
  const todayCashFlow = cashFlowList.filter(cash => 
    new Date(cash.tanggal).toDateString() === today
  )

  const todayMasukCash = todayCashFlow
    .filter(cash => cash.jenis === "MASUK" && cash.sumberDana === "CASH")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const todayMasukBank = todayCashFlow
    .filter(cash => cash.jenis === "MASUK" && cash.sumberDana === "BANK")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const todayKeluarCash = todayCashFlow
    .filter(cash => cash.jenis === "KELUAR" && cash.sumberDana === "CASH")
    .reduce((sum, cash) => sum + cash.jumlah, 0)
    
  const todayKeluarBank = todayCashFlow
    .filter(cash => cash.jenis === "KELUAR" && cash.sumberDana === "BANK")
    .reduce((sum, cash) => sum + cash.jumlah, 0)

  const todayMasuk = todayMasukCash + todayMasukBank
  const todayKeluar = todayKeluarCash + todayKeluarBank

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Cash Flow</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Cash Flow</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Catat Kas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Catat Kas Baru</DialogTitle>
              <DialogDescription>
                Tambahkan catatan kas masuk atau keluar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jenis">Jenis</Label>
                  <Select value={formData.jenis} onValueChange={(value) => setFormData(prev => ({ ...prev, jenis: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASUK">Masuk</SelectItem>
                      <SelectItem value="KELUAR">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sumberDana">Sumber Dana</Label>
                  <Select value={formData.sumberDana} onValueChange={(value) => setFormData(prev => ({ ...prev, sumberDana: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jumlah">Jumlah</Label>
                <Input
                  id="jumlah"
                  type="number"
                  value={formData.jumlah}
                  onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Jelaskan keperluan transaksi..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas Masuk</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMasuk)}</div>
            <p className="text-xs text-muted-foreground">Semua waktu</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas Keluar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalKeluar)}</div>
            <p className="text-xs text-muted-foreground">Semua waktu</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCash)}
            </div>
            <p className="text-xs text-muted-foreground">Kas tunai</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bank</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBank >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netBank)}
            </div>
            <p className="text-xs text-muted-foreground">Saldo bank</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Total bersih</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kas Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              <div className="text-green-600">+{formatCurrency(todayMasuk)}</div>
              <div className="text-red-600">-{formatCurrency(todayKeluar)}</div>
            </div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Cash Flow</CardTitle>
          <CardDescription>
            Catatan arus kas masuk dan keluar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={jenisFilter} onValueChange={setJenisFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="MASUK">Masuk</SelectItem>
                <SelectItem value="KELUAR">Keluar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sumberFilter} onValueChange={setSumberFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Sumber Dana</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCashFlow.map((cash) => (
                <TableRow key={cash.id}>
                  <TableCell>{formatDate(cash.tanggal)}</TableCell>
                  <TableCell>
                    <Badge variant={cash.jenis === "MASUK" ? "default" : "destructive"}>
                      {cash.jenis === "MASUK" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {cash.jenis}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-medium ${cash.jenis === "MASUK" ? "text-green-600" : "text-red-600"}`}>
                    {cash.jenis === "MASUK" ? "+" : "-"}{formatCurrency(cash.jumlah)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {cash.sumberDana}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={cash.keterangan}>
                    {cash.keterangan}
                  </TableCell>
                  <TableCell>{cash.transactionID || "-"}</TableCell>
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