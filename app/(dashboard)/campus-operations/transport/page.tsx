import type { Metadata } from "next"

import { TransportContent } from "./_components/transport-content"

export const metadata: Metadata = {
  title: "Transport — MyCampus360",
}

export default function TransportPage() {
  return <TransportContent />
}
