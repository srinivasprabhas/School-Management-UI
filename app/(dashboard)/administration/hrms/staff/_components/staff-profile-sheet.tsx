"use client"

import { CalendarIcon, FileTextIcon, MailIcon, PhoneIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { initials, formatDate } from "@/lib/format"
import { useLeaveRequests } from "@/lib/data/store/entities"
import type { StaffMember } from "@/lib/data/types"

interface StaffProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffMember | null
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function StaffProfileSheet({ open, onOpenChange, staff }: StaffProfileSheetProps) {
  const { items: leaveRequests } = useLeaveRequests()

  const staffLeave = staff ? leaveRequests.filter((lr) => lr.staffId === staff.id) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-lg">
        {staff ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {staff.photoUrl ? <AvatarImage src={staff.photoUrl} alt={staff.name} /> : null}
                  <AvatarFallback>{initials(staff.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <SheetTitle>{staff.name}</SheetTitle>
                  <SheetDescription>
                    {staff.designation} · {staff.employeeId}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-4">
              <section className="flex flex-col gap-3">
                <h3 className="flex items-center gap-1.5 text-sm font-medium">
                  <UserIcon className="size-4" />
                  Personal Details
                </h3>
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <DetailRow label="Department" value={<Badge variant="secondary">{staff.department}</Badge>} />
                  <DetailRow label="Employment Type" value={<span className="capitalize">{staff.employmentType.replace("_", " ")}</span>} />
                  <DetailRow label="Join Date" value={formatDate(staff.joinDate)} />
                  <DetailRow
                    label="Status"
                    value={<StatusBadge label={staff.status} tone={toneForStatus(staff.status)} className="capitalize" />}
                  />
                  {staff.reportingManager ? (
                    <DetailRow label="Reporting Manager" value={staff.reportingManager} />
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <span className="flex items-center gap-1.5 text-sm">
                    <PhoneIcon className="size-3.5 text-muted-foreground" />
                    {staff.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                    {staff.email}
                  </span>
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="flex items-center gap-1.5 text-sm font-medium">
                  <FileTextIcon className="size-4" />
                  Documents
                </h3>
                <EmptyState
                  icon={FileTextIcon}
                  title="No documents on file"
                  description="Uploaded documents for this staff member will appear here."
                  className="py-6"
                />
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarIcon className="size-4" />
                  Leave History
                </h3>
                {staffLeave.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave requests on record.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {staffLeave.map((lr) => (
                      <div key={lr.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium capitalize">{lr.leaveType} leave</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(lr.fromDate)} – {formatDate(lr.toDate)} · {lr.daysCount}d
                          </span>
                        </div>
                        <StatusBadge label={lr.status} tone={toneForStatus(lr.status)} className="capitalize" />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
