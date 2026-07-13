import type { Metadata } from "next"

import { UsersRolesContent } from "./_components/users-roles-content"

export const metadata: Metadata = {
  title: "Users & Roles — MyCampus360",
}

export default function Page() {
  return <UsersRolesContent />
}
