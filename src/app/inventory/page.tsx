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
  Search, 
  Edit, 
  Eye,
  Archive,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

interface InventoryItem {
  id: string
  loanID: string
  customerID: string
  barang: string
  kondisi: string
  status: "DITAHAN" | "DILELANG" | "TERTEBUS"
  tanggalMasuk: string
  createdAt: string
  updatedAt: string
  loan?: {
    nilaiPinjaman: number
    jatuhTempo: string
    status: string
    nasabah?: {
      nama: string
      noHP: string
    }
  }
}

export default function InventoryPage() {
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    kondisi: "",
    status: ""
  })

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryList(data)
      } else {
        toast.error('Gagal mengambil data inventory')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      kondisi: item.kondisi,
      status: item.status
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingItem) return
    
    try {
      const response = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Inventory berhasil diperbarui')
        await fetchInventory()
        
        // Reset form
        setFormData({
          kondisi: "",
          status: ""
        })
        setEditingItem(null)
        setIsEditDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal memperbarui data')
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast.error('Terjadi kesalahan saat memperbarui data')
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

  const isOverdue = (jatuhTempo: string) => {
    return new Date() > new Date(jatuhTempo)
  }

  const filteredInventory = inventoryList.filter(item => {
    const matchesSearch = 
      item.loanID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.loan?.nasabah?.nama.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DITAHAN":
        return <Clock className="h-4 w-4" />
      case "DILELANG":
        return <AlertTriangle className="h-4 w-4" />
      case "TERTEBUS":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DITAHAN":
        return "default"
      case "DILELANG":
        return "destructive"
      case "TERTEBUS":
        return "secondary"
      default:
        return "outline"
    }
  }

  const stats = {
    total: inventoryList.length,
    ditahan: inventoryList.filter(item => item.status === "DITAHAN").length,
    dilelang: inventoryList.filter(item => item.status === "DILELANG").length,
    tertebus: inventoryList.filter(item => item.status === "TERTEBUS").length
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Semua barang dalam sistem</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditahan</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.ditahan}</div>
            <p className="text-xs text-muted-foreground">Barang dalam penahanan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dilelang</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.dilelang}</div>
            <p className="text-xs text-muted-foreground">Barang dilelang</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tertebus</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.tertebus}</div>
            <p className="text-xs text-muted-foreground">Barang telah ditebus</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Inventory Barang</CardTitle>
          <CardDescription>
            Kelola data barang yang ditahan atau dilelang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari barang..."
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
                <SelectItem value="DITAHAN">Ditahan</SelectItem>
                <SelectItem value="DILELANG">Dilelang</SelectItem>
                <SelectItem value="TERTEBUS">Tertebus</SelectItem>
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
                <TableHead>Kondisi</TableHead>
                <TableHead>Nilai Pinjaman</TableHead>
                <TableHead>Tanggal Masuk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.loanID}</TableCell>
                  <TableCell>{item.customerID}</TableCell>
                  <TableCell>{item.loan?.nasabah?.nama || "-"}</TableCell>
                  <TableCell>{item.barang}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.kondisi}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.loan ? formatCurrency(item.loan.nilaiPinjaman) : "-"}</TableCell>
                  <TableCell>{formatDate(item.tanggalMasuk)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(item.status)}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{item.status}</span>
                      </Badge>
                      {item.loan && item.status === "DITAHAN" && isOverdue(item.loan.jatuhTempo) && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Jatuh Tempo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory</DialogTitle>
            <DialogDescription>
              Update kondisi dan status barang inventory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kondisi">Kondisi Barang</Label>
              <Input
                id="kondisi"
                value={formData.kondisi}
                onChange={(e) => setFormData(prev => ({ ...prev, kondisi: e.target.value }))}
                placeholder="Contoh: Baik, Rusak Ringan, Rusak Berat"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DITAHAN">Ditahan</SelectItem>
                  <SelectItem value="DILELANG">Dilelang</SelectItem>
                  <SelectItem value="TERTEBUS">Tertebus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}