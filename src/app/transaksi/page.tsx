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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  Eye,
  Receipt,
  Calendar,
  Calculator,
  AlertCircle
} from "lucide-react"

interface Transaction {
  id: string
  transactionID: string
  loanID: string
  customerID: string
  jenisTransaksi: "PINJAM" | "TEBUS" | "PERPANJANG"
  jumlah: number
  denda: number
  totalBayar: number
  metodePembayaran?: "CASH" | "BANK"
  tanggal: string
  createdAt: string
  loan?: {
    barang: string
    nilaiPinjaman: number
    jatuhTempo: string
    status: string
  }
  nasabah?: {
    nama: string
    noHP: string
  }
}

interface Loan {
  id: string
  loanID: string
  customerID: string
  barang: string
  nilaiPinjaman: number
  jatuhTempo: string
  status: string
  nasabah?: {
    nama: string
  }
}

export default function TransaksiPage() {
  const [transactionList, setTransactionList] = useState<Transaction[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [transactionType, setTransactionType] = useState<"TEBUS" | "PERPANJANG">("TEBUS")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH")
  const [calculatedValues, setCalculatedValues] = useState({
    denda: 0,
    totalBayar: 0,
    perpanjangFee: 0,
    newJatuhTempo: ""
  })

  // Fetch transactions data
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transaksi')
      if (response.ok) {
        const data = await response.json()
        setTransactionList(data)
      } else {
        toast.error('Gagal mengambil data transaksi')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Terjadi kesalahan saat mengambil data')
    }
  }

  // Fetch active loans
  const fetchActiveLoans = async () => {
    try {
      const response = await fetch('/api/transaksi/active-loans')
      if (response.ok) {
        const data = await response.json()
        setActiveLoans(data)
      } else {
        toast.error('Gagal mengambil data pinjaman aktif')
      }
    } catch (error) {
      console.error('Error fetching active loans:', error)
      toast.error('Terjadi kesalahan saat mengambil data pinjaman aktif')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchTransactions(), fetchActiveLoans()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Calculate denda for late redemption
  const calculateDenda = (nilaiPinjaman: number, jatuhTempo: string, tanggalBayar: string = new Date().toISOString()) => {
    const dueDate = new Date(jatuhTempo)
    const paymentDate = new Date(tanggalBayar)
    
    if (paymentDate <= dueDate) {
      return 0
    }
    
    const diffTime = Math.abs(paymentDate.getTime() - dueDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const periods15Days = Math.ceil(diffDays / 15)
    
    return nilaiPinjaman * 0.05 * periods15Days // 5% per 15 days
  }

  // Calculate perpanjang fee and new due date
  const calculatePerpanjang = (nilaiPinjaman: number, currentJatuhTempo: string) => {
    const perpanjangFee = nilaiPinjaman * 0.1 // 10%
    const currentDue = new Date(currentJatuhTempo)
    const newDue = new Date(currentDue)
    newDue.setMonth(newDue.getMonth() + 1)
    
    return {
      perpanjangFee,
      newJatuhTempo: newDue.toISOString().split('T')[0]
    }
  }

  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan)
    
    if (transactionType === "TEBUS") {
      const denda = calculateDenda(loan.nilaiPinjaman, loan.jatuhTempo)
      const totalBayar = loan.nilaiPinjaman + denda
      
      setCalculatedValues({
        denda,
        totalBayar,
        perpanjangFee: 0,
        newJatuhTempo: ""
      })
    } else {
      const { perpanjangFee, newJatuhTempo } = calculatePerpanjang(loan.nilaiPinjaman, loan.jatuhTempo)
      
      setCalculatedValues({
        denda: 0,
        totalBayar: perpanjangFee,
        perpanjangFee,
        newJatuhTempo
      })
    }
  }

  const handleTransactionTypeChange = (type: "TEBUS" | "PERPANJANG") => {
    setTransactionType(type)
    if (selectedLoan) {
      handleLoanSelect(selectedLoan)
    }
  }

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLoan) return
    
    try {
      const response = await fetch('/api/transaksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanID: selectedLoan.loanID,
          jenisTransaksi: transactionType,
          metodePembayaran: paymentMethod
        })
      })

      if (response.ok) {
        toast.success(`Transaksi ${transactionType.toLowerCase()} berhasil`)
        await Promise.all([fetchTransactions(), fetchActiveLoans()])
        
        // Trigger global refresh for cash flow
        fetch('/api/cash').catch(() => {})
        
        // Reset form
        setSelectedLoan(null)
        setPaymentMethod("CASH")
        setCalculatedValues({
          denda: 0,
          totalBayar: 0,
          perpanjangFee: 0,
          newJatuhTempo: ""
        })
        setIsTransactionDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal memproses transaksi')
      }
    } catch (error) {
      console.error('Error processing transaction:', error)
      toast.error('Terjadi kesalahan saat memproses transaksi')
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

  const filteredTransactions = transactionList.filter(transaction => {
    const matchesSearch = 
      transaction.transactionID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.loanID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.nasabah?.nama.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || transaction.jenisTransaksi === typeFilter
    
    return matchesSearch && matchesType
  })

  const isOverdue = (jatuhTempo: string) => {
    return new Date() > new Date(jatuhTempo)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Transaksi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Buat Transaksi Baru</DialogTitle>
              <DialogDescription>
                Pilih jenis transaksi dan pinjaman yang akan diproses
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={transactionType} onValueChange={(value) => handleTransactionTypeChange(value as "TEBUS" | "PERPANJANG")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="TEBUS">Tebus</TabsTrigger>
                <TabsTrigger value="PERPANJANG">Perpanjang</TabsTrigger>
              </TabsList>
              
              <TabsContent value="TEBUS" className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Pinjaman yang Akan Ditebus</Label>
                  <Select onValueChange={(value) => {
                    const loan = activeLoans.find(l => l.loanID === value)
                    if (loan) handleLoanSelect(loan)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pinjaman" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLoans.map((loan) => (
                        <SelectItem key={loan.id} value={loan.loanID}>
                          {loan.loanID} - {loan.nasabah?.nama} - {loan.barang}
                          {isOverdue(loan.jatuhTempo) && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Terlambat
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedLoan && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Calculator className="mr-2 h-4 w-4" />
                        Detail Perhitungan Tebus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Nilai Pinjaman:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.nilaiPinjaman)}</span>
                      </div>
                      {calculatedValues.denda > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Denda Keterlambatan:</span>
                          <span className="font-medium">{formatCurrency(calculatedValues.denda)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Bayar:</span>
                        <span className="text-green-600">{formatCurrency(calculatedValues.totalBayar)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="PERPANJANG" className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Pinjaman yang Akan Diperpanjang</Label>
                  <Select onValueChange={(value) => {
                    const loan = activeLoans.find(l => l.loanID === value)
                    if (loan) handleLoanSelect(loan)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pinjaman" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLoans.map((loan) => (
                        <SelectItem key={loan.id} value={loan.loanID}>
                          {loan.loanID} - {loan.nasabah?.nama} - {loan.barang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedLoan && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Calculator className="mr-2 h-4 w-4" />
                        Detail Perhitungan Perpanjang
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Biaya Perpanjang (10%):</span>
                        <span className="font-medium">{formatCurrency(calculatedValues.perpanjangFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jatuh Tempo Baru:</span>
                        <span className="font-medium">{formatDate(calculatedValues.newJatuhTempo)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Bayar:</span>
                        <span className="text-green-600">{formatCurrency(calculatedValues.totalBayar)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "CASH" | "BANK")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tunai</SelectItem>
                  <SelectItem value="BANK">Transfer Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <form onSubmit={handleSubmitTransaction}>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={!selectedLoan}>
                  Proses {transactionType === "TEBUS" ? "Tebus" : "Perpanjang"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            Semua transaksi yang telah dilakukan
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="PINJAM">Pinjam</SelectItem>
                <SelectItem value="TEBUS">Tebus</SelectItem>
                <SelectItem value="PERPANJANG">Perpanjang</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Loan ID</TableHead>
                <TableHead>Nama Nasabah</TableHead>
                <TableHead>Jenis Transaksi</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Denda</TableHead>
                <TableHead>Total Bayar</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.transactionID}</TableCell>
                  <TableCell>{transaction.loanID}</TableCell>
                  <TableCell>{transaction.nasabah?.nama || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      transaction.jenisTransaksi === "PINJAM" ? "default" :
                      transaction.jenisTransaksi === "TEBUS" ? "secondary" : "outline"
                    }>
                      {transaction.jenisTransaksi}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.jumlah)}</TableCell>
                  <TableCell className={transaction.denda > 0 ? "text-red-600 font-medium" : ""}>
                    {transaction.denda > 0 ? formatCurrency(transaction.denda) : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(transaction.totalBayar)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.metodePembayaran === "CASH" ? "default" : "secondary"}>
                      {transaction.metodePembayaran || "CASH"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.tanggal)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
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