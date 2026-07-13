import { Suspense } from "react"
import type { Metadata } from "next"

import { CollectFeeFlow } from "./_components/collect-fee-flow"

export const metadata: Metadata = {
  title: "Collect Fee — MyCampus360",
}

export default function CollectFeePage() {
  return (
    <Suspense>
      <CollectFeeFlow />
    </Suspense>
  )
}
