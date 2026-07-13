import type { Metadata } from "next"

import { RecruitmentContent } from "./_components/recruitment-content"

export const metadata: Metadata = {
  title: "Recruitment — MyCampus360",
}

export default function Page() {
  return <RecruitmentContent />
}
