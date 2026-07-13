import { StudentProfile } from "./_components/student-profile"

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <StudentProfile studentId={id} />
}
