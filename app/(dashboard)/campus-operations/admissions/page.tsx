import type { Metadata } from "next"

import { AdmissionsContent } from "./_components/admissions-content"

export const metadata: Metadata = {
  title: "Admissions — MyCampus360",
}

export default function AdmissionsPage() {
  return <AdmissionsContent />
}
