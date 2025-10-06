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
  Trash2, 
  Eye,
  UserPlus
} from "lucide-react"

interface Nasabah {
  id: string
  customerID: string
  nama: string
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN"
  ktp: string
  alamat: string
  noHP: string
  pekerjaan: string
  sumberInfo: string
  createdAt: string
  updatedAt: string
}

export default function NasabahPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingNasabah, setEditingNasabah] = useState<Nasabah | null>(null)
  const [formData, setFormData] = useState({
    nama: "",
    jenisKelamin: "",
    ktp: "",
    alamat: "",
    noHP: "",
    pekerjaan: "",
    sumberInfo: ""
  })

  // Fetch nasabah data
  const fetchNasabah = async () => {
    try {
      const response = await fetch('/api/nasabah')
      if (response.ok) {
        const data = await response.json()
        setNasabahList(data)
      } else {
        toast.error('Gagal mengambil data nasabah')
      }
    } catch (error) {
      console.error('Error fetching nasabah:', error)
      toast.error('Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNasabah()
  }, [])

  const generateCustomerID = (nama: string, noHP: string) => {
    const namaDepan = nama.split(' ')[0].substring(0, 2).toUpperCase()
    const hpLast4 = noHP.slice(-4)
    return `${namaDepan}${hpLast4}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingNasabah ? `/api/nasabah/${editingNasabah.id}` : '/api/nasabah'
      const method = editingNasabah ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingNasabah ? 'Data nasabah berhasil diperbarui' : 'Nasabah berhasil ditambahkan')
        await fetchNasabah()
        
        // Reset form
        setFormData({
          nama: "",
          jenisKelamin: "",
          ktp: "",
          alamat: "",
          noHP: "",
          pekerjaan: "",
          sumberInfo: ""
        })
        setEditingNasabah(null)
        setIsAddDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan data')
      }
    } catch (error) {
      console.error('Error saving nasabah:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    }
  }

  const handleEdit = (nasabah: Nasabah) => {
    setEditingNasabah(nasabah)
    setFormData({
      nama: nasabah.nama,
      jenisKelamin: nasabah.jenisKelamin,
      ktp: nasabah.ktp,
      alamat: nasabah.alamat,
      noHP: nasabah.noHP,
      pekerjaan: nasabah.pekerjaan,
      sumberInfo: nasabah.sumberInfo
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data nasabah ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/nasabah/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Data nasabah berhasil dihapus')
        await fetchNasabah()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menghapus data')
      }
    } catch (error) {
      console.error('Error deleting nasabah:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const filteredNasabah = nasabahList.filter(nasabah =>
    nasabah.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nasabah.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nasabah.noHP.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Nasabah</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Nasabah</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingNasabah(null)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Nasabah
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingNasabah ? "Edit Nasabah" : "Tambah Nasabah Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingNasabah ? "Edit data nasabah yang ada." : "Tambahkan nasabah baru ke sistem."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                  <Select value={formData.jenisKelamin} onValueChange={(value) => setFormData(prev => ({ ...prev, jenisKelamin: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                      <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ktp">No. KTP</Label>
                <Input
                  id="ktp"
                  value={formData.ktp}
                  onChange={(e) => setFormData(prev => ({ ...prev, ktp: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noHP">No. HP</Label>
                  <Input
                    id="noHP"
                    value={formData.noHP}
                    onChange={(e) => setFormData(prev => ({ ...prev, noHP: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pekerjaan">Pekerjaan</Label>
                  <Input
                    id="pekerjaan"
                    value={formData.pekerjaan}
                    onChange={(e) => setFormData(prev => ({ ...prev, pekerjaan: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sumberInfo">Sumber Info</Label>
                <Select value={formData.sumberInfo} onValueChange={(value) => setFormData(prev => ({ ...prev, sumberInfo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber info" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teman">Teman</SelectItem>
                    <SelectItem value="Media Sosial">Media Sosial</SelectItem>
                    <SelectItem value="Iklan">Iklan</SelectItem>
                    <SelectItem value="Lewat">Lewat</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingNasabah ? "Update" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Nasabah</CardTitle>
          <CardDescription>
            Kelola data nasabah sistem gadai
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Pekerjaan</TableHead>
                <TableHead>Sumber Info</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNasabah.map((nasabah) => (
                <TableRow key={nasabah.id}>
                  <TableCell className="font-medium">{nasabah.customerID}</TableCell>
                  <TableCell>{nasabah.nama}</TableCell>
                  <TableCell>
                    <Badge variant={nasabah.jenisKelamin === "LAKI_LAKI" ? "default" : "secondary"}>
                      {nasabah.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                    </Badge>
                  </TableCell>
                  <TableCell>{nasabah.noHP}</TableCell>
                  <TableCell>{nasabah.pekerjaan}</TableCell>
                  <TableCell>{nasabah.sumberInfo}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(nasabah)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(nasabah.id)}>
                        <Trash2 className="h-4 w-4" />
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