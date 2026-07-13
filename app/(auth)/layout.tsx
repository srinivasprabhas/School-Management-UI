import Link from "next/link"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Logo } from "@/components/shared/logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex items-center justify-between p-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <Logo size={44} />
          MyCampus360
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>
    </div>
  )
}
