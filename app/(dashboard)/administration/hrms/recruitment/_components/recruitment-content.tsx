"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, UserPlusIcon, UserSearchIcon, UsersIcon, MessageSquareIcon, TrophyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { useCandidates, useJobOpenings } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { Candidate, JobOpening } from "@/lib/data/types"
import { buildCandidateColumns } from "./candidate-columns"
import { buildOpeningColumns } from "./opening-columns"
import { ScheduleInterviewDialog } from "./schedule-interview-dialog"
import { AddOpeningDialog } from "./add-opening-dialog"

const STAGE_ORDER: Candidate["stage"][] = ["applied", "screening", "interview", "offer", "hired"]

export function RecruitmentContent() {
  const { items: candidates, update: updateCandidate } = useCandidates()
  const { items: openings, add: addOpening } = useJobOpenings()
  const logActivity = useLogActivity()

  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null)
  const [rejectingCandidate, setRejectingCandidate] = useState<Candidate | null>(null)

  const jobsById = useMemo(() => new Map(openings.map((j) => [j.id, j])), [openings])

  const funnel = useMemo(() => {
    const counts: Record<string, number> = {}
    STAGE_ORDER.forEach((stage) => (counts[stage] = 0))
    candidates.forEach((c) => {
      if (c.stage in counts) counts[c.stage] += 1
    })
    return counts
  }, [candidates])

  const candidateColumns = useMemo(
    () =>
      buildCandidateColumns({
        jobsById,
        onMoveStage: (c) => {
          const idx = STAGE_ORDER.indexOf(c.stage)
          if (idx === -1 || idx === STAGE_ORDER.length - 1) return
          const nextStage = STAGE_ORDER[idx + 1]
          updateCandidate(c.id, { stage: nextStage })
          logActivity({
            action: "update",
            module: "HRMS",
            entityType: "Candidate",
            entityId: c.id,
            description: `Moved ${c.name} to ${nextStage} stage`,
          })
          toast.success(`Moved to ${nextStage}`, { description: c.name })
        },
        onScheduleInterview: (c) => setSchedulingCandidate(c),
        onReject: (c) => setRejectingCandidate(c),
      }),
    [jobsById, updateCandidate, logActivity]
  )

  const openingColumns = useMemo(() => buildOpeningColumns(), [])

  const departmentOptions = useMemo(() => {
    const depts = [...new Set(openings.map((j) => j.department))]
    return depts.map((d) => ({ label: d, value: d }))
  }, [openings])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Recruitment" description="Hiring pipeline." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Applied" value={funnel.applied} icon={UsersIcon} />
        <StatCard title="Screening" value={funnel.screening} icon={UserSearchIcon} />
        <StatCard title="Interview" value={funnel.interview} icon={MessageSquareIcon} />
        <StatCard title="Offer" value={funnel.offer} icon={UserPlusIcon} />
        <StatCard title="Hired" value={funnel.hired} icon={TrophyIcon} variant="success" />
      </div>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="openings">Openings</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="pt-4">
          <DataTable
            columns={candidateColumns}
            data={candidates}
            searchKey="name"
            searchPlaceholder="Search candidates…"
            filters={[
              {
                columnId: "stage",
                title: "Stage",
                options: [
                  { label: "Applied", value: "applied" },
                  { label: "Screening", value: "screening" },
                  { label: "Interview", value: "interview" },
                  { label: "Offer", value: "offer" },
                  { label: "Hired", value: "hired" },
                  { label: "Rejected", value: "rejected" },
                ],
              },
            ]}
            emptyTitle="No candidates found"
            emptyDescription="Try adjusting your filters."
          />
        </TabsContent>

        <TabsContent value="openings" className="flex flex-col gap-4 pt-4">
          <div className="flex justify-end">
            <AddOpeningDialog
              trigger={
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Add Opening
                </Button>
              }
              onSubmit={(opening: JobOpening) => addOpening(opening)}
            />
          </div>
          <DataTable
            columns={openingColumns}
            data={openings}
            searchKey="title"
            searchPlaceholder="Search openings…"
            filters={[{ columnId: "department", title: "Department", options: departmentOptions }]}
            emptyTitle="No openings found"
            emptyDescription="Post a new opening to get started."
          />
        </TabsContent>
      </Tabs>

      <ScheduleInterviewDialog
        candidate={schedulingCandidate}
        onOpenChange={(open) => !open && setSchedulingCandidate(null)}
        onConfirm={(candidate, interviewDate) => {
          updateCandidate(candidate.id, { interviewDate })
          logActivity({
            action: "update",
            module: "HRMS",
            entityType: "Candidate",
            entityId: candidate.id,
            description: `Scheduled interview for ${candidate.name} on ${interviewDate}`,
          })
          toast.success("Interview scheduled", { description: candidate.name })
          setSchedulingCandidate(null)
        }}
      />

      <ConfirmDialog
        open={!!rejectingCandidate}
        onOpenChange={(open) => !open && setRejectingCandidate(null)}
        title="Reject candidate?"
        description={`${rejectingCandidate?.name} will be marked as rejected.`}
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={() => {
          if (!rejectingCandidate) return
          updateCandidate(rejectingCandidate.id, { stage: "rejected" })
          logActivity({
            action: "update",
            module: "HRMS",
            entityType: "Candidate",
            entityId: rejectingCandidate.id,
            description: `Rejected candidate ${rejectingCandidate.name}`,
          })
          toast.success("Candidate rejected")
          setRejectingCandidate(null)
        }}
      />
    </div>
  )
}
