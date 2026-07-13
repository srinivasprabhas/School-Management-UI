import { ReceiptView } from "./_components/receipt-view"

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ receiptId: string }>
}) {
  const { receiptId } = await params
  return <ReceiptView receiptId={receiptId} />
}
