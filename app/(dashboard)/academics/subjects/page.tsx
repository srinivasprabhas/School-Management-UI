import type { Metadata } from "next"

import { SubjectsView } from "./_components/subjects-view"

export const metadata: Metadata = {
  title: "Subjects — MyCampus360",
}

export default function SubjectsPage() {
  return <SubjectsView />
}
