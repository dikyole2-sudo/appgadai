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
  Edit, 
  Trash2, 
  Eye,
  Users,
  Settings,
  Shield,
  Key,
  Building
} from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  role: "ADMIN" | "KASIR"
  createdAt: string
  updatedAt: string
}

interface Cabang {
  id: string
  nama: string
  alamat: string
  telepon: string
  status: "AKTIF" | "NONAKTIF"
  createdAt: string
  updatedAt: string
}

export default function PengaturanPage() {
  const [users, setUsers] = useState<User[]>([])
  const [cabangs, setCabangs] = useState<Cabang[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isCabangDialogOpen, setIsCabangDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingCabang, setEditingCabang] = useState<Cabang | null>(null)
  
  const [userFormData, setUserFormData] = useState({
    email: "",
    name: "",
    role: "",
    password: ""
  })
  
  const [cabangFormData, setCabangFormData] = useState({
    nama: "",
    alamat: "",
    telepon: "",
    status: ""
  })

  // Fetch users data
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error('Gagal mengambil data users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Terjadi kesalahan saat mengambil data users')
    }
  }

  // Fetch cabangs data
  const fetchCabangs = async () => {
    try {
      const response = await fetch('/api/cabang')
      if (response.ok) {
        const data = await response.json()
        setCabangs(data)
      } else {
        toast.error('Gagal mengambil data cabang')
      }
    } catch (error) {
      console.error('Error fetching cabangs:', error)
      toast.error('Terjadi kesalahan saat mengambil data cabang')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUsers(), fetchCabangs()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUser ? '/api/users' : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingUser ? { ...userFormData, id: editingUser.id } : userFormData)
      })

      if (response.ok) {
        toast.success(`User berhasil ${editingUser ? 'diupdate' : 'ditambahkan'}`)
        await fetchUsers()
        
        // Reset form
        setUserFormData({
          email: "",
          name: "",
          role: "",
          password: ""
        })
        setEditingUser(null)
        setIsUserDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan user')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Terjadi kesalahan saat menyimpan user')
    }
  }

  const handleCabangSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCabang ? '/api/cabang' : '/api/cabang'
      const method = editingCabang ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCabang ? { ...cabangFormData, id: editingCabang.id } : cabangFormData)
      })

      if (response.ok) {
        toast.success(`Cabang berhasil ${editingCabang ? 'diupdate' : 'ditambahkan'}`)
        await fetchCabangs()
        
        // Reset form
        setCabangFormData({
          nama: "",
          alamat: "",
          telepon: "",
          status: ""
        })
        setEditingCabang(null)
        setIsCabangDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan cabang')
      }
    } catch (error) {
      console.error('Error saving cabang:', error)
      toast.error('Terjadi kesalahan saat menyimpan cabang')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: ""
    })
    setIsUserDialogOpen(true)
  }

  const handleEditCabang = (cabang: Cabang) => {
    setEditingCabang(cabang)
    setCabangFormData({
      nama: cabang.nama,
      alamat: cabang.alamat,
      telepon: cabang.telepon,
      status: cabang.status
    })
    setIsCabangDialogOpen(true)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return
    
    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User berhasil dihapus')
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menghapus user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Terjadi kesalahan saat menghapus user')
    }
  }

  const handleDeleteCabang = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus cabang ini?")) return
    
    try {
      const response = await fetch(`/api/cabang?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Cabang berhasil dihapus')
        await fetchCabangs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menghapus cabang')
      }
    } catch (error) {
      console.error('Error deleting cabang:', error)
      toast.error('Terjadi kesalahan saat menghapus cabang')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="cabang" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Cabang
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manajemen User</CardTitle>
                  <CardDescription>
                    Kelola user dan hak akses sistem
                  </CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingUser(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? "Edit User" : "Tambah User Baru"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingUser ? "Edit data user yang ada." : "Tambahkan user baru ke sistem."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                          id="name"
                          value={userFormData.name}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={userFormData.role} onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="KASIR">Kasir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {!editingUser && (
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={userFormData.password}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button type="submit">
                          {editingUser ? "Update" : "Simpan"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Diupdate</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.role !== "ADMIN" && (
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cabang" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manajemen Cabang</CardTitle>
                  <CardDescription>
                    Kelola data cabang gadai
                  </CardDescription>
                </div>
                <Dialog open={isCabangDialogOpen} onOpenChange={setIsCabangDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingCabang(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Cabang
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCabang ? "Edit Cabang" : "Tambah Cabang Baru"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCabang ? "Edit data cabang yang ada." : "Tambahkan cabang baru ke sistem."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCabangSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nama">Nama Cabang</Label>
                        <Input
                          id="nama"
                          value={cabangFormData.nama}
                          onChange={(e) => setCabangFormData(prev => ({ ...prev, nama: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="alamat">Alamat</Label>
                        <Input
                          id="alamat"
                          value={cabangFormData.alamat}
                          onChange={(e) => setCabangFormData(prev => ({ ...prev, alamat: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="telepon">Telepon</Label>
                        <Input
                          id="telepon"
                          value={cabangFormData.telepon}
                          onChange={(e) => setCabangFormData(prev => ({ ...prev, telepon: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={cabangFormData.status} onValueChange={(value) => setCabangFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AKTIF">Aktif</SelectItem>
                            <SelectItem value="NONAKTIF">Non Aktif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCabangDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button type="submit">
                          {editingCabang ? "Update" : "Simpan"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Cabang</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cabangs.map((cabang) => (
                    <TableRow key={cabang.id}>
                      <TableCell className="font-medium">{cabang.nama}</TableCell>
                      <TableCell>{cabang.alamat}</TableCell>
                      <TableCell>{cabang.telepon}</TableCell>
                      <TableCell>
                        <Badge variant={cabang.status === "AKTIF" ? "default" : "secondary"}>
                          {cabang.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(cabang.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditCabang(cabang)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCabang(cabang.id)}>
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
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
              <CardDescription>
                Konfigurasi sistem dan preferensi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Konfigurasi Gadai</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="potongan">Persentase Potongan (%)</Label>
                    <Input id="potongan" defaultValue="10" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="denda">Persentase Denda per 15 hari (%)</Label>
                    <Input id="denda" defaultValue="5" disabled />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informasi Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Versi Sistem</p>
                    <p className="text-sm text-muted-foreground">v1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-sm text-muted-foreground">SQLite</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}