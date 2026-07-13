"use client"

import { FileIcon, FileTextIcon, LinkIcon, PresentationIcon, VideoIcon, type LucideIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toneBgClass } from "@/components/shared/status-badge"
import { formatDate, initials } from "@/lib/format"
import type { ClassSection, StudyMaterial, Subject, Teacher } from "@/lib/data/types"

const FILE_TYPE_ICON: Record<StudyMaterial["fileType"], LucideIcon> = {
  pdf: FileTextIcon,
  doc: FileIcon,
  ppt: PresentationIcon,
  video: VideoIcon,
  link: LinkIcon,
}

const FILE_TYPE_TONE_CLASS: Record<StudyMaterial["fileType"], string> = {
  pdf: toneBgClass("destructive"),
  doc: toneBgClass("info"),
  ppt: toneBgClass("warning"),
  video: toneBgClass("success"),
  link: toneBgClass("neutral"),
}

function formatFileSize(kb: number): string {
  return kb > 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${kb} KB`
}

interface MaterialCardProps {
  material: StudyMaterial
  subject?: Subject
  classSection?: ClassSection
  uploader?: Teacher
}

export function MaterialCard({ material, subject, classSection, uploader }: MaterialCardProps) {
  const Icon = FILE_TYPE_ICON[material.fileType]

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${FILE_TYPE_TONE_CLASS[material.fileType]}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="line-clamp-2 leading-snug font-medium">{material.title}</p>
            <div className="flex flex-wrap gap-1">
              {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
              {classSection ? (
                <Badge variant="outline">
                  {classSection.className} {classSection.section}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar size="sm">
            <AvatarFallback>{uploader ? initials(`${uploader.firstName} ${uploader.lastName}`) : "?"}</AvatarFallback>
          </Avatar>
          <span className="truncate">{uploader ? `${uploader.firstName} ${uploader.lastName}` : "Unknown"}</span>
          <span>·</span>
          <span className="shrink-0">{formatDate(material.uploadDate)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(material.fileSizeKb)}</span>
          <span>{material.downloadCount} downloads</span>
        </div>
      </CardContent>
    </Card>
  )
}
