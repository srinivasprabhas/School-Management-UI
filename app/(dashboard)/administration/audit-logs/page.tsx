import type { Metadata } from "next"

import { AuditLogContent } from "./_components/audit-log-content"

export const metadata: Metadata = {
  title: "Audit Logs — MyCampus360",
}

export default function Page() {
  return <AuditLogContent />
}
