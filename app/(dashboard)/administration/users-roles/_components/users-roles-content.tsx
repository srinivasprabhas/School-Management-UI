"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { useAppUsers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { usePermission } from "@/hooks/use-permission"
import { ROLES, ROLE_LABELS } from "@/lib/rbac/types"
import type { AppUser } from "@/lib/data/types"
import { buildUserColumns } from "./user-columns"
import { InviteUserDialog } from "./invite-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangeRoleDialog } from "./change-role-dialog"
import { RoleCards } from "./role-cards"

export function UsersRolesContent() {
  const { items: users, add, update, remove } = useAppUsers()
  const logActivity = useLogActivity()
  const { can } = usePermission()
  const canDelete = can("users:manage")

  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [changingRoleUser, setChangingRoleUser] = useState<AppUser | null>(null)
  const [togglingUser, setTogglingUser] = useState<AppUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null)

  const roleOptions = useMemo(() => ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r })), [])

  const columns = useMemo(
    () =>
      buildUserColumns({
        canDelete,
        onEdit: (u) => setEditingUser(u),
        onChangeRole: (u) => setChangingRoleUser(u),
        onResetPassword: (u) =>
          toast.success("Password reset email sent", { description: u.email }),
        onToggleStatus: (u) => setTogglingUser(u),
        onDelete: (u) => setDeletingUser(u),
      }),
    [canDelete]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users & Roles" description="Manage users and permissions." />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="flex flex-col gap-4 pt-4">
          <div className="flex justify-end">
            <InviteUserDialog
              trigger={
                <Button>
                  <UserPlusIcon data-icon="inline-start" />
                  Invite User
                </Button>
              }
              onSubmit={(user) => {
                add(user)
                toast.success("Invitation sent", { description: `${user.name} — ${user.email}` })
              }}
            />
          </div>
          <DataTable
            columns={columns}
            data={users}
            searchKey="name"
            searchPlaceholder="Search by name…"
            filters={[
              { columnId: "role", title: "Role", options: roleOptions },
              {
                columnId: "status",
                title: "Status",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Invited", value: "invited" },
                  { label: "Suspended", value: "suspended" },
                ],
              },
            ]}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your filters, or invite your first user."
          />
        </TabsContent>

        <TabsContent value="roles" className="pt-4">
          <RoleCards />
        </TabsContent>
      </Tabs>

      <EditUserDialog
        user={editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={(id, patch) => update(id, patch)}
      />

      <ChangeRoleDialog
        user={changingRoleUser}
        onOpenChange={(open) => !open && setChangingRoleUser(null)}
        onSubmit={(id, role) => update(id, { role })}
      />

      <ConfirmDialog
        open={!!togglingUser}
        onOpenChange={(open) => !open && setTogglingUser(null)}
        title={togglingUser?.status === "suspended" ? "Activate user?" : "Suspend user?"}
        description={
          togglingUser?.status === "suspended"
            ? `${togglingUser?.name} will regain access to the system.`
            : `${togglingUser?.name} will lose access to the system until reactivated.`
        }
        confirmLabel={togglingUser?.status === "suspended" ? "Activate" : "Suspend"}
        variant={togglingUser?.status === "suspended" ? "default" : "destructive"}
        onConfirm={() => {
          if (!togglingUser) return
          const nextStatus = togglingUser.status === "suspended" ? "active" : "suspended"
          update(togglingUser.id, { status: nextStatus })
          logActivity({
            action: "update",
            module: "Users & Roles",
            entityType: "AppUser",
            entityId: togglingUser.id,
            description: `${nextStatus === "suspended" ? "Suspended" : "Activated"} user ${togglingUser.name}`,
          })
          toast.success(nextStatus === "suspended" ? "User suspended" : "User activated")
          setTogglingUser(null)
        }}
      />

      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Delete user?"
        description={`This will permanently remove ${deletingUser?.name}'s account. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingUser) return
          remove(deletingUser.id)
          logActivity({
            action: "delete",
            module: "Users & Roles",
            entityType: "AppUser",
            entityId: deletingUser.id,
            description: `Deleted user ${deletingUser.name}`,
          })
          toast.success("User deleted")
          setDeletingUser(null)
        }}
      />
    </div>
  )
}
