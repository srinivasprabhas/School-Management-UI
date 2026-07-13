import { ExamDetail } from "./_components/exam-detail"

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  return <ExamDetail examId={examId} />
}
