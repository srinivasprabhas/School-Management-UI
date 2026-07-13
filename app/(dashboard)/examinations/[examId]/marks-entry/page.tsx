import { MarksEntry } from "./_components/marks-entry"

export default async function MarksEntryPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  return <MarksEntry examId={examId} />
}
