import { RankList } from "./_components/rank-list"

export default async function RankListPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  return <RankList examId={examId} />
}
