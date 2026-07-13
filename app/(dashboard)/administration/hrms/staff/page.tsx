import type { Metadata } from "next"

import { StaffTable } from "./_components/staff-table"

export const metadata: Metadata = {
  title: "Staff Directory — MyCampus360",
}

export default function Page() {
  return <StaffTable />
}
