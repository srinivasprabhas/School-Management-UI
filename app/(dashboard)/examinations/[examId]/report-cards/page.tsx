import { ReportCards } from "./_components/report-cards"

export default async function ReportCardsPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  return <ReportCards examId={examId} />
}
