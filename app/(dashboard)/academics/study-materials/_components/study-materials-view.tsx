"use client"

import { useMemo, useState } from "react"
import { FolderOpenIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { useClassSections, useStudyMaterials, useSubjects, useTeachers } from "@/lib/data/store/entities"
import { MaterialCard } from "./material-card"
import { UploadMaterialDialog } from "./upload-material-dialog"

export function StudyMaterialsView() {
  const { items: materials, add } = useStudyMaterials()
  const { items: subjects } = useSubjects()
  const { items: classSections } = useClassSections()
  const { items: teachers } = useTeachers()

  const [uploadOpen, setUploadOpen] = useState(false)

  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])
  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Study Materials"
        description={`${materials.length} resources shared across classes.`}
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Upload
          </Button>
        }
      />

      {materials.length === 0 ? (
        <EmptyState
          icon={FolderOpenIcon}
          title="No study materials yet"
          description="Upload your first resource to get started."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              subject={subjectsById.get(m.subjectId)}
              classSection={classSectionsById.get(m.classSectionId)}
              uploader={teachersById.get(m.uploadedBy)}
            />
          ))}
        </div>
      )}

      <UploadMaterialDialog open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={(material) => add(material)} />
    </div>
  )
}
