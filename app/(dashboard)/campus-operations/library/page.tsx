import type { Metadata } from "next"

import { LibraryContent } from "./_components/library-content"

export const metadata: Metadata = {
  title: "Library — MyCampus360",
}

export default function LibraryPage() {
  return <LibraryContent />
}
