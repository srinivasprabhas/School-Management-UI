"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppUsers } from "@/lib/data/store/entities"
import { ROLES, ROLE_LABELS } from "@/lib/rbac/types"
import type { Role } from "@/lib/rbac/types"
import { PermissionMatrixSheet } from "./permission-matrix-sheet"

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Full system access across every module, including RBAC configuration.",
  principal: "School-wide oversight of academics, staff, fees, and reporting.",
  vice_principal: "Deputy leadership access, mirrors the principal minus HR and settings.",
  teacher: "Classroom-level access to attendance, academics, and exams.",
  accountant: "Manages fee collection, payroll, and financial reporting.",
  receptionist: "Front-office access for admissions, student records, and fee intake.",
  librarian: "Manages the library catalog and book issue/return workflow.",
  transport_manager: "Manages vehicles, routes, and transport reporting.",
  hostel_manager: "Oversees hostel residents' attendance and transport needs.",
  parent: "View-only access to their child's academics, attendance, and fees.",
  student: "View-only access to their own academics, attendance, and events.",
}

export function RoleCards() {
  const { items: users } = useAppUsers()
  const [viewingRole, setViewingRole] = useState<Role | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length
          return (
            <Card key={role}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{ROLE_LABELS[role]}</CardTitle>
                  <Badge variant="outline">{count} user{count === 1 ? "" : "s"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setViewingRole(role)}>
                  View Permissions
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <PermissionMatrixSheet role={viewingRole} onOpenChange={(open) => !open && setViewingRole(null)} />
    </>
  )
}
