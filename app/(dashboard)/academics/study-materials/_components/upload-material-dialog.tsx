"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLogActivity } from "@/lib/data/audit"
import { useClassSections, useSubjects } from "@/lib/data/store/entities"
import type { StudyMaterial } from "@/lib/data/types"

interface UploadMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (material: StudyMaterial) => void
}

interface FormValues {
  title: string
  subjectId: string
  classSectionId: string
  fileType: StudyMaterial["fileType"]
}

const EMPTY_FORM: FormValues = { title: "", subjectId: "", classSectionId: "", fileType: "pdf" }

export function UploadMaterialDialog({ open, onOpenChange, onSubmit }: UploadMaterialDialogProps) {
  const { items: subjects } = useSubjects()
  const { items: classSections } = useClassSections()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)

  useEffect(() => {
    if (open) setValues(EMPTY_FORM)
  }, [open])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || !values.subjectId || !values.classSectionId) {
      toast.error("Please fill in all required fields.")
      return
    }
    const result: StudyMaterial = {
      id: `mat_new_${Date.now()}`,
      title: values.title.trim(),
      subjectId: values.subjectId,
      classSectionId: values.classSectionId,
      uploadedBy: "",
      uploadDate: new Date().toISOString().slice(0, 10),
      fileType: values.fileType,
      fileSizeKb: Math.floor(Math.random() * 4000) + 200,
      downloadCount: 0,
    }
    onSubmit(result)
    logActivity({
      action: "create",
      module: "Academics",
      entityType: "StudyMaterial",
      entityId: result.id,
      description: `Uploaded study material "${result.title}"`,
    })
    toast.success("Material uploaded", { description: result.title })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Study Material</DialogTitle>
          <DialogDescription>
            This is a demo — no file is actually uploaded. Only the details below are saved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mat-title">Title</FieldLabel>
              <Input id="mat-title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="mat-subject">Subject</FieldLabel>
                <Select value={values.subjectId} onValueChange={(v) => set("subjectId", v ?? "")}>
                  <SelectTrigger id="mat-subject" className="w-full">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="mat-class">Class</FieldLabel>
                <Select value={values.classSectionId} onValueChange={(v) => set("classSectionId", v ?? "")}>
                  <SelectTrigger id="mat-class" className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classSections.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.className} — {cs.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="mat-type">File Type</FieldLabel>
              <Select
                value={values.fileType}
                onValueChange={(v) => set("fileType", (v ?? "pdf") as StudyMaterial["fileType"])}
              >
                <SelectTrigger id="mat-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="ppt">Presentation</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>This is a demo — no file is actually uploaded.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Upload</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
