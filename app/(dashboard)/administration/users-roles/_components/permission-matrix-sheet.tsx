"use client"

import { toast } from "sonner"
import { CheckIcon, MinusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { usePermission } from "@/hooks/use-permission"
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from "@/lib/rbac/role-permissions"
import { ROLE_LABELS } from "@/lib/rbac/types"
import type { Role } from "@/lib/rbac/types"

interface PermissionMatrixSheetProps {
  role: Role | null
  onOpenChange: (open: boolean) => void
}

function groupByModule(permissions: typeof ALL_PERMISSIONS) {
  const groups = new Map<string, typeof ALL_PERMISSIONS>()
  permissions.forEach((p) => {
    const [module] = p.split(":")
    const list = groups.get(module) ?? []
    list.push(p)
    groups.set(module, list)
  })
  return groups
}

export function PermissionMatrixSheet({ role, onOpenChange }: PermissionMatrixSheetProps) {
  const { role: currentRole } = usePermission()
  const isSuperAdmin = currentRole === "super_admin"
  const groups = groupByModule(ALL_PERMISSIONS)

  return (
    <Sheet open={!!role} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-md">
        {role ? (
          <>
            <SheetHeader>
              <SheetTitle>{ROLE_LABELS[role]} — Permissions</SheetTitle>
              <SheetDescription>
                Live view of what this role can access, grouped by module. Derived from the static RBAC
                configuration.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-4">
              {[...groups.entries()].map(([module, permissions]) => (
                <div key={module} className="flex flex-col gap-2">
                  <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{module}</h4>
                  <div className="flex flex-col gap-1.5 rounded-lg border p-2.5">
                    {permissions.map((permission) => {
                      const granted = hasPermission(role, permission)
                      return (
                        <div key={permission} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{permission.split(":")[1]}</span>
                          {isSuperAdmin ? (
                            <Checkbox checked={granted} disabled aria-label={permission} />
                          ) : granted ? (
                            <CheckIcon className="size-4 text-success" />
                          ) : (
                            <MinusIcon className="size-4 text-muted-foreground/50" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {ROLE_PERMISSIONS[role].length} of {ALL_PERMISSIONS.length} permissions granted.
              </p>
            </div>
            {isSuperAdmin ? (
              <SheetFooter className="flex-row justify-end gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    toast.info("Changes not persisted", {
                      description:
                        "Role permissions are defined in a static config file in this demo and cannot be edited from the UI.",
                    })
                  }
                >
                  Save Changes
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
