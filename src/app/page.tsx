"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  Plus,
  Eye
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

interface DashboardStats {
  totalPinjamanAktif: number
  totalBarangAktif: number
  totalTebusanBulanIni: number
  labaBersih: number
  totalPinjamanCount: number
  totalTebusanCount: number
}

interface Transaction {
  id: string
  customerName?: string
  jenisTransaksi: string
  totalBayar: number
  tanggal: string
  loan?: {
    nasabah?: {
      nama: string
    }
  }
}

interface ExpiringLoan {
  loanID: string
  barang: string
  nilaiPinjaman: number
  jatuhTempo: string
  loan?: {
    nasabah?: {
      nama: string
    }
  }
}

interface ChartData {
  date: string
  pinjaman: number
  tebusan: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPinjamanAktif: 0,
    totalBarangAktif: 0,
    totalTebusanBulanIni: 0,
    labaBersih: 0,
    totalPinjamanCount: 0,
    totalTebusanCount: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [expiringLoans, setExpiringLoans] = useState<ExpiringLoan[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const loansResponse = await fetch('/api/barang')
      const transactionsResponse = await fetch('/api/transaksi')
      const inventoryResponse = await fetch('/api/inventory')

      if (loansResponse.ok && transactionsResponse.ok && inventoryResponse.ok) {
        const loans = await loansResponse.json()
        const transactions = await transactionsResponse.json()
        const inventory = await inventoryResponse.json()

        // Calculate stats
        const activeLoans = loans.filter((loan: any) => loan.status === 'AKTIF')
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        const thisMonthTransactions = transactions.filter((trx: any) => {
          const trxDate = new Date(trx.tanggal)
          return trxDate.getMonth() === currentMonth && trxDate.getFullYear() === currentYear
        })

        const tebusanThisMonth = thisMonthTransactions.filter((trx: any) => trx.jenisTransaksi === 'TEBUS')
        const pinjamanThisMonth = thisMonthTransactions.filter((trx: any) => trx.jenisTransaksi === 'PINJAM')

        const totalPinjamanAktif = activeLoans.reduce((sum: number, loan: any) => sum + loan.nilaiPinjaman, 0)
        const totalTebusanBulanIni = tebusanThisMonth.reduce((sum: number, trx: any) => sum + trx.totalBayar, 0)
        const labaBersih = totalTebusanBulanIni * 0.1 // Estimated 10% profit

        setStats({
          totalPinjamanAktif,
          totalBarangAktif: activeLoans.length,
          totalTebusanBulanIni,
          labaBersih,
          totalPinjamanCount: activeLoans.length,
          totalTebusanCount: tebusanThisMonth.length
        })

        // Set recent transactions (last 5)
        setRecentTransactions(transactions.slice(0, 5))

        // Find expiring loans (within 7 days)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        
        const expiring = activeLoans.filter((loan: any) => {
          const jatuhTempo = new Date(loan.jatuhTempo)
          return jatuhTempo <= sevenDaysFromNow
        }).map((loan: any) => ({
          loanID: loan.loanID,
          barang: loan.barang,
          nilaiPinjaman: loan.nilaiPinjaman,
          jatuhTempo: loan.jatuhTempo,
          loan: loan
        }))

        setExpiringLoans(expiring)

        // Prepare chart data (last 7 days)
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)
          
          const dayTransactions = transactions.filter((trx: any) => {
            const trxDate = new Date(trx.tanggal)
            return trxDate >= date && trxDate < nextDate
          })

          const pinjaman = dayTransactions
            .filter((trx: any) => trx.jenisTransaksi === 'PINJAM')
            .reduce((sum: number, trx: any) => sum + trx.totalBayar, 0)
          
          const tebusan = dayTransactions
            .filter((trx: any) => trx.jenisTransaksi === 'TEBUS')
            .reduce((sum: number, trx: any) => sum + trx.totalBayar, 0)

          last7Days.push({
            date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            pinjaman,
            tebusan
          })
        }
        
        setChartData(last7Days)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  const getDaysLeft = (jatuhTempo: string) => {
    const today = new Date()
    const dueDate = new Date(jatuhTempo)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const statsCards = [
    {
      title: "Total Pinjaman Aktif",
      value: formatCurrency(stats.totalPinjamanAktif),
      change: `+${stats.totalPinjamanCount} pinjaman`,
      changeType: "positive" as const,
      icon: Package,
      description: "Pinjaman aktif"
    },
    {
      title: "Total Barang Aktif",
      value: stats.totalBarangAktif.toString(),
      change: "Barang dalam gadai",
      changeType: "positive" as const,
      icon: Package,
      description: "Unit aktif"
    },
    {
      title: "Total Tebusan Bulan Ini",
      value: formatCurrency(stats.totalTebusanBulanIni),
      change: `+${stats.totalTebusanCount} tebusan`,
      changeType: "positive" as const,
      icon: DollarSign,
      description: "Bulan ini"
    },
    {
      title: "Laba Bersih",
      value: formatCurrency(stats.labaBersih),
      change: "Estimasi",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "Bulan ini"
    }
  ]

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Transaksi Baru
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  stat.changeType === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {stat.change}
                </span>{" "}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Active Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Grafik Pinjaman & Tebusan</CardTitle>
            <CardDescription>
              7 hari terakhir
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="pinjaman" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Pinjaman"
                />
                <Line 
                  type="monotone" 
                  dataKey="tebusan" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Tebusan"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>
              Transaksi terbaru dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.loan?.nasabah?.nama || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.jenisTransaksi} • {formatCurrency(transaction.totalBayar)}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <Badge variant="default">
                      Selesai
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Eye className="mr-2 h-4 w-4" />
              Lihat Semua Transaksi
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Loans */}
      <Card>
        <CardHeader>
          <CardTitle>Pinjaman Akan Jatuh Tempo</CardTitle>
          <CardDescription>
            Pinjaman yang akan jatuh tempo dalam 7 hari ke depan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiringLoans.length > 0 ? (
            <div className="space-y-4">
              {expiringLoans.map((loan) => {
                const daysLeft = getDaysLeft(loan.jatuhTempo)
                return (
                  <div key={loan.loanID} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{loan.loan?.nasabah?.nama || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {loan.barang} • {formatCurrency(loan.nilaiPinjaman)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Jatuh Tempo: {formatDate(loan.jatuhTempo)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'}>
                        {daysLeft} hari lagi
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Tidak ada pinjaman yang akan jatuh tempo dalam 7 hari ke depan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}