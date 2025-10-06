"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  BarChart3, 
  Users, 
  Package, 
  Receipt, 
  FileText, 
  Settings, 
  Menu,
  Home,
  Archive,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Nasabah",
    href: "/nasabah",
    icon: Users,
  },
  {
    title: "Barang Gadai",
    href: "/barang",
    icon: Package,
  },
  {
    title: "Transaksi",
    href: "/transaksi",
    icon: Receipt,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Archive,
  },
  {
    title: "Cash Flow",
    href: "/cash",
    icon: DollarSign,
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: FileText,
  },
  {
    title: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-blue-dark">
            Mandiri Gadai Indonesia
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={`w-full justify-start ${pathname === item.href ? 'bg-blue-dark text-white hover:bg-blue-dark' : 'text-blue-dark hover:bg-blue-50'}`}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({ className }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <ScrollArea className="flex-1">
            <Sidebar className="border-0" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn("hidden border-r bg-muted/40 md:block", className)}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </div>
          <div className="flex-1">
            <ScrollArea className="h-full">
              <Sidebar />
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  )
}