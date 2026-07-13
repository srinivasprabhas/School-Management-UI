import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopBar } from "@/components/layout/top-bar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
