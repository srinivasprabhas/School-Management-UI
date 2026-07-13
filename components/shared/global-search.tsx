"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpenIcon,
  BusIcon,
  GraduationCapIcon,
  LayersIcon,
  ReceiptIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { QUICK_ACTIONS } from "@/lib/nav/quick-actions"
import {
  useBooks,
  useClassSections,
  useFeeTransactions,
  useStudents,
  useSubjects,
  useTeachers,
  useVehicles,
} from "@/lib/data/store/entities"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { items: feeTransactions } = useFeeTransactions()
  const { items: books } = useBooks()
  const { items: vehicles } = useVehicles()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!q) return null
    const studentMatches = students
      .filter((s) => `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(q))
      .slice(0, 5)
    const teacherMatches = teachers
      .filter((t) => `${t.firstName} ${t.lastName} ${t.employeeId}`.toLowerCase().includes(q))
      .slice(0, 5)
    const classMatches = classSections
      .filter((c) => `${c.className} ${c.section}`.toLowerCase().includes(q))
      .slice(0, 5)
    const subjectMatches = subjects.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 5)
    const feeMatches = feeTransactions
      .filter((f) => f.receiptNo.toLowerCase().includes(q) && f.receiptNo)
      .slice(0, 5)
    const bookMatches = books
      .filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(q))
      .slice(0, 5)
    const vehicleMatches = vehicles.filter((v) => v.regNo.toLowerCase().includes(q)).slice(0, 5)

    return {
      studentMatches,
      teacherMatches,
      classMatches,
      subjectMatches,
      feeMatches,
      bookMatches,
      vehicleMatches,
    }
  }, [q, students, teachers, classSections, subjects, feeTransactions, books, vehicles])

  const hasResults =
    results &&
    Object.values(results).some((arr) => arr.length > 0)

  return (
    <>
      <Button
        variant="outline"
        className="h-8 w-full max-w-sm justify-start gap-2 text-muted-foreground sm:pr-12"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search students, teachers, classes…</span>
        <span className="sm:hidden">Search…</span>
        <kbd className="pointer-events-none ml-auto hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search MyCampus360">
        <CommandInput
          placeholder="Search students, teachers, classes, subjects, receipts, books, vehicles…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!q ? (
            <CommandGroup heading="Quick Actions">
              {QUICK_ACTIONS.map((action) => (
                <CommandItem key={action.id} onSelect={() => go(action.href)}>
                  <action.icon />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : !hasResults ? (
            <CommandEmpty>No results for &quot;{query}&quot;.</CommandEmpty>
          ) : (
            <>
              {results!.studentMatches.length > 0 && (
                <CommandGroup heading="Students">
                  {results!.studentMatches.map((s) => (
                    <CommandItem key={s.id} onSelect={() => go(`/students/${s.id}`)}>
                      <UsersIcon />
                      {s.firstName} {s.lastName}
                      <span className="ml-auto text-xs text-muted-foreground">{s.admissionNo}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results!.teacherMatches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Teachers">
                    {results!.teacherMatches.map((t) => (
                      <CommandItem key={t.id} onSelect={() => go(`/teachers/${t.id}`)}>
                        <GraduationCapIcon />
                        {t.firstName} {t.lastName}
                        <span className="ml-auto text-xs text-muted-foreground">{t.employeeId}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results!.classMatches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Classes">
                    {results!.classMatches.map((c) => (
                      <CommandItem
                        key={c.id}
                        onSelect={() => go(`/academics/classes-sections`)}
                      >
                        <LayersIcon />
                        {c.className} — {c.section}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results!.subjectMatches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Subjects">
                    {results!.subjectMatches.map((s) => (
                      <CommandItem key={s.id} onSelect={() => go(`/academics/subjects`)}>
                        <BookOpenIcon />
                        {s.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results!.feeMatches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Fee Receipts">
                    {results!.feeMatches.map((f) => (
                      <CommandItem key={f.id} onSelect={() => go(`/fees`)}>
                        <ReceiptIcon />
                        {f.receiptNo}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results!.bookMatches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Books">
                    {results!.bookMatches.map((b) => (
                      <CommandItem
                        key={b.id}
                        onSelect={() => go(`/campus-operations/library`)}
                      >
                        <BookOpenIcon />
                        {b.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results!.vehicleMatches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Vehicles">
                    {results!.vehicleMatches.map((v) => (
                      <CommandItem
                        key={v.id}
                        onSelect={() => go(`/campus-operations/transport`)}
                      >
                        <BusIcon />
                        {v.regNo}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
