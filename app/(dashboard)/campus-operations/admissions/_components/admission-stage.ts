import type { AdmissionStage } from "@/lib/data/types"
import type { StatusTone } from "@/components/shared/status-badge"

/** Pipeline order used both for the funnel stats and the "Move to Next Stage" action. "rejected" is a terminal side-branch, not part of the forward sequence. */
export const ADMISSION_STAGE_ORDER: AdmissionStage[] = [
  "inquiry",
  "application",
  "interview",
  "offer",
  "enrolled",
]

export const ADMISSION_STAGE_LABEL: Record<AdmissionStage, string> = {
  inquiry: "Inquiry",
  application: "Application",
  interview: "Interview",
  offer: "Offer",
  enrolled: "Enrolled",
  rejected: "Rejected",
}

/**
 * Local tone map for admission stages. These aren't literal EntityStatus values
 * (interview/offer map to "warning" here, not the "info" the shared toneForStatus
 * would give them), so this is intentionally separate from status-badge.tsx.
 */
const ADMISSION_STAGE_TONE: Record<AdmissionStage, StatusTone> = {
  inquiry: "info",
  application: "info",
  interview: "warning",
  offer: "warning",
  enrolled: "success",
  rejected: "destructive",
}

export function admissionStageTone(stage: AdmissionStage): StatusTone {
  return ADMISSION_STAGE_TONE[stage]
}

/** Cycles a lead forward through the pipeline. Rejected leads and leads already enrolled don't advance further. */
export function nextAdmissionStage(stage: AdmissionStage): AdmissionStage {
  const idx = ADMISSION_STAGE_ORDER.indexOf(stage)
  if (idx === -1 || idx === ADMISSION_STAGE_ORDER.length - 1) return stage
  return ADMISSION_STAGE_ORDER[idx + 1]
}
