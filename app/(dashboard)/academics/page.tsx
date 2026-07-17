import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Building2Icon, CalendarDaysIcon, ClipboardListIcon, FolderOpenIcon, LibraryBigIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { toneBgClass, type StatusTone } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AcademicsCard {
  title: string
  description: string
  href: string
  icon: LucideIcon
  tone: StatusTone
}

const CARDS: AcademicsCard[] = [
  {
    title: "Classes & Sections",
    description: "Manage classes, sections, room assignments, and class teachers.",
    href: "/academics/classes-sections",
    icon: Building2Icon,
    tone: "info",
  },
  {
    title: "Subjects",
    description: "Maintain the subject catalog, applicable classes, and teacher assignments.",
    href: "/academics/subjects",
    icon: LibraryBigIcon,
    tone: "success",
  },
  {
    title: "Timetable",
    description: "Build the weekly class schedule by day and period, or view it by teacher.",
    href: "/academics/timetable",
    icon: CalendarDaysIcon,
    tone: "warning",
  },
  {
    title: "Assignments",
    description: "Track homework, assignments, projects, and lesson plans by class.",
    href: "/academics/assignments",
    icon: ClipboardListIcon,
    tone: "destructive",
  },
  {
    title: "Study Materials",
    description: "Browse shared notes, guides, and resources uploaded for each class.",
    href: "/academics/study-materials",
    icon: FolderOpenIcon,
    tone: "info",
  },
]

export default function AcademicsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Academics" description="Academic structure and planning." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <div className={cn("flex size-9 items-center justify-center rounded-lg", toneBgClass(card.tone))}>
                  <card.icon className="size-4" />
                </div>
                <CardTitle className="pt-2">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
