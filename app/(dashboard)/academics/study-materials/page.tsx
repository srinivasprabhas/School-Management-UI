import type { Metadata } from "next"

import { StudyMaterialsView } from "./_components/study-materials-view"

export const metadata: Metadata = {
  title: "Study Materials — MyCampus360",
}

export default function StudyMaterialsPage() {
  return <StudyMaterialsView />
}
