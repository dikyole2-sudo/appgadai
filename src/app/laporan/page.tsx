"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  FileText, 
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Filter,
  BarChart3,
  PieChart
} from "lucide-react"

interface ReportData {
  totalPinjaman: number
  totalDenda: number
  totalTebusan: number
  totalLabaBersih: number
  jumlahNasabah: number
  jumlahBarangAktif: number
  genderStats: Array<{ jenisKelamin: string; _count: { jenisKelamin: number } }>
  occupationStats: Array<{ pekerjaan: string; _count: { pekerjaan: number } }>
  infoSourceStats: Array<{ sumberInfo: string; _count: { sumberInfo: number } }>
  monthlyTrend: Array<{
    bulan: string
    totalPinjaman: number
    totalTebusan: number
    totalDenda: number
    labaBersih: number
  }>
  detailedTransactions: Array<{
    id: string
    tanggal: string
    transactionID: string
    customerID: string
    jenisTransaksi: string
    jumlah: number
    denda: number
    totalBayar: number
    nasabah?: {
      nama: string
    }
  }>
}

export default function LaporanPage() {
  const [reportType, setReportType] = useState<string>("bulanan")
  const [timeRange, setTimeRange] = useState<string>("bulan-ini")
  const [cabang, setCabang] = useState<string>("pusat")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/laporan?type=${reportType}&timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        toast.error('Gagal mengambil data laporan')
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [reportType, timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(format)
      const filename = `laporan-${reportType}-${new Date().toISOString().split('T')[0]}`
      
      if (format === 'excel') {
        await exportToExcel(filename)
      } else if (format === 'pdf') {
        await exportToPDF(filename)
      }
      
      toast.success(`Laporan berhasil diunduh sebagai ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Gagal mengunduh laporan sebagai ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  const exportToExcel = async (filename: string) => {
    // Get fresh data from API
    const response = await fetch(`/api/laporan/export?type=${reportType}&timeRange=${timeRange}&format=excel`)
    if (!response.ok) {
      throw new Error('Failed to fetch export data')
    }
    
    const exportData = await response.json()
    const XLSX = await import('xlsx')
    
    // Prepare data for Excel with better formatting
    const worksheetData = [
      ['LAPORAN PEGADAIAN SYARIAH'],
      [getReportTitle()],
      [''],
      ['RINGKASAN KEUANGAN'],
      ['Metrik', 'Jumlah'],
      ['Total Pinjaman', exportData.totalPinjaman || 0],
      ['Total Denda', exportData.totalDenda || 0],
      ['Total Tebusan', exportData.totalTebusan || 0],
      ['Laba Bersih', exportData.totalLabaBersih || 0],
      ['Jumlah Nasabah', exportData.jumlahNasabah || 0],
      ['Barang Aktif', exportData.jumlahBarangAktif || 0],
      [''],
      ['ANALISIS DEMOGRAFI'],
      [''],
      ['Distribusi Jenis Kelamin'],
      ['Jenis Kelamin', 'Jumlah', 'Persentase'],
      ...(exportData.genderStats || []).map((stat: any) => {
        const total = exportData.genderStats?.reduce((sum: number, s: any) => sum + s._count.jenisKelamin, 0) || 1
        const percentage = ((stat._count.jenisKelamin / total) * 100).toFixed(1)
        return [stat.jenisKelamin, stat._count.jenisKelamin, `${percentage}%`]
      }),
      [''],
      ['Distribusi Pekerjaan'],
      ['Pekerjaan', 'Jumlah', 'Persentase'],
      ...(exportData.occupationStats || []).map((stat: any) => {
        const total = exportData.occupationStats?.reduce((sum: number, s: any) => sum + s._count.pekerjaan, 0) || 1
        const percentage = ((stat._count.pekerjaan / total) * 100).toFixed(1)
        return [stat.pekerjaan, stat._count.pekerjaan, `${percentage}%`]
      }),
      [''],
      ['Sumber Informasi'],
      ['Sumber Info', 'Jumlah', 'Persentase'],
      ...(exportData.infoSourceStats || []).map((stat: any) => {
        const total = exportData.infoSourceStats?.reduce((sum: number, s: any) => sum + s._count.sumberInfo, 0) || 1
        const percentage = ((stat._count.sumberInfo / total) * 100).toFixed(1)
        return [stat.sumberInfo, stat._count.sumberInfo, `${percentage}%`]
      }),
      [''],
      ['DETAIL TRANSAKSI'],
      ['Tanggal', 'Transaction ID', 'Nama Nasabah', 'Jenis Transaksi', 'Jumlah Pinjaman', 'Denda', 'Total Bayar'],
      ...(exportData.detailedTransactions || []).map((transaction: any) => [
        new Date(transaction.tanggal).toLocaleDateString('id-ID'),
        transaction.transactionID,
        transaction.nasabah?.nama || '-',
        transaction.jenisTransaksi,
        transaction.jumlah || 0,
        transaction.denda || 0,
        transaction.totalBayar || 0
      ])
    ]

    // Add monthly trend if available
    if (reportType === 'bulanan' && exportData.monthlyTrend?.length) {
      worksheetData.push(
        [''],
        ['TREN BULANAN'],
        ['Bulan', 'Total Pinjaman', 'Total Tebusan', 'Total Denda', 'Laba Bersih'],
        ...exportData.monthlyTrend.map((data: any) => [
          data.bulan,
          data.totalPinjaman || 0,
          data.totalTebusan || 0,
          data.totalDenda || 0,
          data.labaBersih || 0
        ])
      )
    }

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Description/Label
      { wch: 20 }, // Value/Amount
      { wch: 15 }, // Percentage (when applicable)
    ]
    
    // For transactions section, use wider columns
    if (exportData.detailedTransactions?.length) {
      ws['!cols'] = [
        { wch: 15 }, // Tanggal
        { wch: 25 }, // Transaction ID
        { wch: 30 }, // Nama Nasabah
        { wch: 15 }, // Jenis Transaksi
        { wch: 20 }, // Jumlah Pinjaman
        { wch: 15 }, // Denda
        { wch: 20 }, // Total Bayar
      ]
    } else {
      ws['!cols'] = colWidths
    }

    // Apply styling to headers and important sections
    const range = XLSX.utils.decode_range(ws['!ref']!)
    
    for (let R = 0; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) continue
        
        const cellValue = ws[cellAddress].v
        
        // Style main title
        if (R === 0) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
          }
        }
        // Style subtitle
        else if (R === 1) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: 'center' }
          }
        }
        // Style section headers
        else if (cellValue === 'RINGKASAN KEUANGAN' || 
                 cellValue === 'ANALISIS DEMOGRAFI' ||
                 cellValue === 'Distribusi Jenis Kelamin' ||
                 cellValue === 'Distribusi Pekerjaan' ||
                 cellValue === 'Sumber Informasi' ||
                 cellValue === 'DETAIL TRANSAKSI' ||
                 cellValue === 'TREN BULANAN') {
          ws[cellAddress].s = {
            font: { bold: true, sz: 14 },
            fill: { fgColor: { rgb: 'E3F2FD' } } // Light blue background
          }
        }
        // Style column headers
        else if ((R === 4 && cellValue === 'Metrik') ||
                 (R === 13 && cellValue === 'Jenis Kelamin') ||
                 (R === 17 + (exportData.genderStats?.length || 0) && cellValue === 'Pekerjaan') ||
                 (R === 21 + (exportData.genderStats?.length || 0) + (exportData.occupationStats?.length || 0) && cellValue === 'Sumber Info') ||
                 (R === 25 + (exportData.genderStats?.length || 0) + (exportData.occupationStats?.length || 0) + (exportData.infoSourceStats?.length || 0) && cellValue === 'Tanggal')) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'F5F5F5' } } // Light gray background
          }
        }
        // Style currency values (right align)
        else if (C === 1 && R >= 5 && R <= 10) {
          ws[cellAddress].s = {
            alignment: { horizontal: 'right' }
          }
        }
      }
    }

    // Write file
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const exportToPDF = async (filename: string) => {
    // Get fresh data from API
    const response = await fetch(`/api/laporan/export?type=${reportType}&timeRange=${timeRange}&format=pdf`)
    if (!response.ok) {
      throw new Error('Failed to fetch export data')
    }
    
    const exportData = await response.json()
    const jsPDF = await import('jspdf')
    
    // Create PDF document
    const pdf = new jsPDF.jsPDF('p', 'mm', 'a4')
    
    // Define colors
    const primaryColor = [59, 130, 246] // blue-500
    const textGray = [107, 114, 128] // gray-500
    
    // Add title with color
    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(20)
    pdf.text('LAPORAN PEGADAIAN', 105, 20, { align: 'center' })
    
    pdf.setTextColor(...textGray)
    pdf.setFontSize(14)
    pdf.text(getReportTitle(), 105, 30, { align: 'center' })
    
    // Reset to black text
    pdf.setTextColor(0, 0, 0)
    
    // Add summary section
    let yPosition = 50
    pdf.setFontSize(16)
    pdf.setFont(undefined, 'bold')
    pdf.text('RINGKASAN', 20, yPosition)
    pdf.setFont(undefined, 'normal')
    
    yPosition += 10
    pdf.setFontSize(12)
    const summaryData = [
      `Total Pinjaman: ${formatCurrency(exportData.totalPinjaman || 0)}`,
      `Total Denda: ${formatCurrency(exportData.totalDenda || 0)}`,
      `Total Tebusan: ${formatCurrency(exportData.totalTebusan || 0)}`,
      `Laba Bersih: ${formatCurrency(exportData.totalLabaBersih || 0)}`,
      `Jumlah Nasabah: ${exportData.jumlahNasabah || 0}`
    ]
    
    summaryData.forEach((text, index) => {
      pdf.text(text, 20, yPosition + (index * 7))
    })
    
    yPosition += summaryData.length * 7 + 10
    
    // Add gender distribution
    if (exportData.genderStats?.length > 0) {
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('DISTRIBUSI JENIS KELAMIN', 20, yPosition)
      pdf.setFont(undefined, 'normal')
      
      yPosition += 10
      pdf.setFontSize(12)
      exportData.genderStats.forEach((stat: any) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`${stat.jenisKelamin}: ${stat._count.jenisKelamin}`, 20, yPosition)
        yPosition += 7
      })
      yPosition += 10
    }
    
    // Add occupation distribution
    if (exportData.occupationStats?.length > 0) {
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('DISTRIBUSI PEKERJAAN', 20, yPosition)
      pdf.setFont(undefined, 'normal')
      
      yPosition += 10
      pdf.setFontSize(12)
      exportData.occupationStats.forEach((stat: any) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`${stat.pekerjaan}: ${stat._count.pekerjaan}`, 20, yPosition)
        yPosition += 7
      })
      yPosition += 10
    }
    
    // Add info source distribution
    if (exportData.infoSourceStats?.length > 0) {
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('SUMBER INFORMASI', 20, yPosition)
      pdf.setFont(undefined, 'normal')
      
      yPosition += 10
      pdf.setFontSize(12)
      exportData.infoSourceStats.forEach((stat: any) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`${stat.sumberInfo}: ${stat._count.sumberInfo}`, 20, yPosition)
        yPosition += 7
      })
      yPosition += 10
    }
    
    // Add detailed transactions if space allows
    if (yPosition < 250 && exportData.detailedTransactions?.length > 0) {
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('DETAIL TRANSAKSI (5 Teratas)', 20, yPosition)
      pdf.setFont(undefined, 'normal')
      
      yPosition += 10
      pdf.setFontSize(10)
      
      // Add table headers
      pdf.setFont(undefined, 'bold')
      pdf.text('Tanggal', 20, yPosition)
      pdf.text('ID Transaksi', 50, yPosition)
      pdf.text('Nama Nasabah', 90, yPosition)
      pdf.text('Total', 150, yPosition)
      pdf.setFont(undefined, 'normal')
      
      yPosition += 7
      
      exportData.detailedTransactions.slice(0, 5).forEach((transaction: any) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
          // Re-add headers on new page
          pdf.setFont(undefined, 'bold')
          pdf.text('Tanggal', 20, yPosition)
          pdf.text('ID Transaksi', 50, yPosition)
          pdf.text('Nama Nasabah', 90, yPosition)
          pdf.text('Total', 150, yPosition)
          pdf.setFont(undefined, 'normal')
          yPosition += 7
        }
        
        const tanggal = new Date(transaction.tanggal).toLocaleDateString('id-ID')
        const id = transaction.transactionID.substring(0, 10) + '...'
        const nama = (transaction.nasabah?.nama || '-').substring(0, 15) + '...'
        const total = formatCurrency(transaction.totalBayar)
        
        pdf.text(tanggal, 20, yPosition)
        pdf.text(id, 50, yPosition)
        pdf.text(nama, 90, yPosition)
        pdf.text(total, 150, yPosition)
        yPosition += 7
      })
    }
    
    // Add footer
    const pageCount = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.setTextColor(...textGray)
      pdf.text(`Halaman ${i} dari ${pageCount}`, 105, 287, { align: 'center' })
      pdf.text(`Dicetak pada ${new Date().toLocaleString('id-ID')}`, 105, 292, { align: 'center' })
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`)
  }

  const getReportTitle = () => {
    const typeMap = {
      'harian': 'Laporan Harian',
      'bulanan': 'Laporan Bulanan', 
      'tahunan': 'Laporan Tahunan'
    }
    
    const rangeMap = {
      'hari-ini': 'Hari Ini',
      'minggu-ini': 'Minggu Ini',
      'bulan-ini': 'Bulan Ini',
      'tahun-ini': 'Tahun Ini',
      'custom': 'Periode Tertentu'
    }
    
    return `${typeMap[reportType as keyof typeof typeMap]} - ${rangeMap[timeRange as keyof typeof rangeMap]}`
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Tidak ada data laporan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
          >
            {exporting === 'excel' ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
          >
            {exporting === 'pdf' ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeRange">Rentang Waktu</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari-ini">Hari Ini</SelectItem>
                  <SelectItem value="minggu-ini">Minggu Ini</SelectItem>
                  <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                  <SelectItem value="tahun-ini">Tahun Ini</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cabang">Cabang</Label>
              <Select value={cabang} onValueChange={setCabang}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pusat">Cabang Pusat</SelectItem>
                  <SelectItem value="cabang1">Cabang Jakarta</SelectItem>
                  <SelectItem value="cabang2">Cabang Surabaya</SelectItem>
                  <SelectItem value="semua">Semua Cabang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full" onClick={fetchReportData}>
                <Calendar className="mr-2 h-4 w-4" />
                Generate Laporan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{getReportTitle()}</CardTitle>
          <CardDescription>
            Ringkasan laporan periode terpilih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalPinjaman)}</div>
                <p className="text-xs text-muted-foreground">Jumlah pinjaman</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Denda</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalDenda)}</div>
                <p className="text-xs text-muted-foreground">Denda keterlambatan</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tebusan</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalTebusan)}</div>
                <p className="text-xs text-muted-foreground">Barang ditebus</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalLabaBersih)}</div>
                <p className="text-xs text-muted-foreground">Total laba</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nasabah Aktif</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.jumlahNasabah}</div>
                <p className="text-xs text-muted-foreground">Total nasabah</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Gender Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-4 w-4" />
              Distribusi Jenis Kelamin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData.genderStats.map((stat) => (
                <div key={stat.jenisKelamin} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stat.jenisKelamin}</span>
                  <Badge variant="outline">{stat._count.jenisKelamin}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Occupation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Distribusi Pekerjaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reportData.occupationStats.map((stat) => (
                <div key={stat.pekerjaan} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stat.pekerjaan}</span>
                  <Badge variant="outline">{stat._count.pekerjaan}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Source Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-4 w-4" />
              Sumber Informasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData.infoSourceStats.map((stat) => (
                <div key={stat.sumberInfo} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stat.sumberInfo}</span>
                  <Badge variant="outline">{stat._count.sumberInfo}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {reportType === "bulanan" && (
        <Card>
          <CardHeader>
            <CardTitle>Tren Bulanan Pinjaman & Tebusan</CardTitle>
            <CardDescription>
              Perkembangan transaksi per bulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan</TableHead>
                  <TableHead>Total Pinjaman</TableHead>
                  <TableHead>Total Tebusan</TableHead>
                  <TableHead>Total Denda</TableHead>
                  <TableHead>Laba Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.monthlyTrend.map((data, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{data.bulan}</TableCell>
                    <TableCell>{formatCurrency(data.totalPinjaman)}</TableCell>
                    <TableCell>{formatCurrency(data.totalTebusan)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(data.totalDenda)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(data.labaBersih)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detailed Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Transaksi</CardTitle>
          <CardDescription>
            Rincian transaksi periode terpilih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Nama Nasabah</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Denda</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.detailedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.tanggal).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="font-medium">{transaction.transactionID}</TableCell>
                    <TableCell>{transaction.nasabah?.nama || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        transaction.jenisTransaksi === "PINJAM" ? "default" :
                        transaction.jenisTransaksi === "TEBUS" ? "secondary" : "outline"
                      }>
                        {transaction.jenisTransaksi}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.jumlah)}</TableCell>
                    <TableCell className={transaction.denda > 0 ? "text-red-600" : ""}>
                      {transaction.denda > 0 ? formatCurrency(transaction.denda) : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(transaction.totalBayar)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}