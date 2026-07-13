import { TeacherProfile } from "./_components/teacher-profile"

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TeacherProfile teacherId={id} />
}
