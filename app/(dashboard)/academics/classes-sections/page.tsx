import type { Metadata } from "next"

import { ClassesSectionsView } from "./_components/classes-sections-view"

export const metadata: Metadata = {
  title: "Classes & Sections — MyCampus360",
}

export default function ClassesSectionsPage() {
  return <ClassesSectionsView />
}
