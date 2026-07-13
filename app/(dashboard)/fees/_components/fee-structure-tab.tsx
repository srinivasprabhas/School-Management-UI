"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { useLogActivity } from "@/lib/data/audit"
import {
  useClasses,
  useClassSections,
  useFeeCategories,
  useFeeInstallments,
  useAcademicSession,
} from "@/lib/data/store/entities"
import { formatCurrency, formatDate } from "@/lib/format"
import type { ClassSection, FeeCategory, FeeInstallment } from "@/lib/data/types"

const FREQUENCY_OPTIONS: { value: FeeCategory["frequency"]; label: string }[] = [
  { value: "one_time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
]

interface CategoryFormValues {
  name: string
  frequency: FeeCategory["frequency"]
  defaultAmount: string
  applicableClassIds: string[]
}

const EMPTY_CATEGORY_FORM: CategoryFormValues = {
  name: "",
  frequency: "annual",
  defaultAmount: "",
  applicableClassIds: [],
}

interface InstallmentFormValues {
  label: string
  dueDate: string
  amount: string
  classSectionId: string
}

const EMPTY_INSTALLMENT_FORM: InstallmentFormValues = {
  label: "",
  dueDate: "",
  amount: "",
  classSectionId: "",
}

export function FeeStructureTab() {
  const { items: categories, add: addCategory } = useFeeCategories()
  const { items: installments, add: addInstallment } = useFeeInstallments()
  const { items: classes } = useClasses()
  const { items: classSections } = useClassSections()
  const { value: session } = useAcademicSession()
  const logActivity = useLogActivity()

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id ?? null)
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState<CategoryFormValues>(EMPTY_CATEGORY_FORM)
  const [installmentFormOpen, setInstallmentFormOpen] = useState(false)
  const [installmentForm, setInstallmentForm] = useState<InstallmentFormValues>(EMPTY_INSTALLMENT_FORM)

  const classSectionsById = useMemo(
    () => new Map<string, ClassSection>(classSections.map((cs) => [cs.id, cs])),
    [classSections]
  )

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null

  const categoryColumns: ColumnDef<FeeCategory>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ getValue }) => <span className="capitalize">{getValue<string>().replace("_", " ")}</span>,
      },
      {
        accessorKey: "defaultAmount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Default Amount" />,
        cell: ({ getValue }) => formatCurrency(getValue<number>()),
      },
      {
        id: "classes",
        header: "Applicable Classes",
        cell: ({ row }) => `${row.original.applicableClassIds.length} classes`,
      },
    ],
    []
  )

  const installmentColumns: ColumnDef<FeeInstallment>[] = useMemo(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
      },
      {
        id: "class",
        header: "Class & Section",
        cell: ({ row }) => {
          const section = classSectionsById.get(row.original.classSectionId)
          return section ? `${section.className} — ${section.section}` : "—"
        },
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ getValue }) => formatCurrency(getValue<number>()),
      },
    ],
    [classSectionsById]
  )

  const installmentsForCategory = useMemo(
    () => installments.filter((fi) => fi.categoryId === selectedCategoryId),
    [installments, selectedCategoryId]
  )

  function toggleClassId(id: string, checked: boolean) {
    setCategoryForm((prev) => ({
      ...prev,
      applicableClassIds: checked
        ? [...prev.applicableClassIds, id]
        : prev.applicableClassIds.filter((c) => c !== id),
    }))
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryForm.name.trim()) {
      toast.error("Please enter a category name.")
      return
    }
    const id = `fc_custom_${Date.now()}`
    addCategory({
      id,
      name: categoryForm.name.trim(),
      frequency: categoryForm.frequency,
      defaultAmount: Number(categoryForm.defaultAmount) || 0,
      applicableClassIds: categoryForm.applicableClassIds,
    })
    logActivity({
      action: "create",
      module: "Fees",
      entityType: "FeeCategory",
      entityId: id,
      description: `Added fee category ${categoryForm.name.trim()}`,
    })
    toast.success("Fee category added")
    setCategoryForm(EMPTY_CATEGORY_FORM)
    setCategoryFormOpen(false)
    setSelectedCategoryId(id)
  }

  function handleAddInstallment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCategoryId) {
      toast.error("Select a fee category first.")
      return
    }
    if (!installmentForm.label.trim() || !installmentForm.dueDate || !installmentForm.classSectionId) {
      toast.error("Please fill in all installment fields.")
      return
    }
    const id = `fi_custom_${Date.now()}`
    addInstallment({
      id,
      categoryId: selectedCategoryId,
      classSectionId: installmentForm.classSectionId,
      academicYear: session.year,
      label: installmentForm.label.trim(),
      dueDate: installmentForm.dueDate,
      amount: Number(installmentForm.amount) || 0,
    })
    logActivity({
      action: "create",
      module: "Fees",
      entityType: "FeeInstallment",
      entityId: id,
      description: `Added installment ${installmentForm.label.trim()} for ${selectedCategory?.name ?? "a fee category"}`,
    })
    toast.success("Installment added")
    setInstallmentForm(EMPTY_INSTALLMENT_FORM)
    setInstallmentFormOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Fee Categories</CardTitle>
            <CardDescription>
              Click a category to view and manage its installments below.
            </CardDescription>
          </div>
          <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon data-icon="inline-start" />
              Add Category
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fee Category</DialogTitle>
                <DialogDescription>Define a new fee category and its default amount.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="cat-name">Name</FieldLabel>
                    <Input
                      id="cat-name"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((v) => ({ ...v, name: e.target.value }))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="cat-frequency">Frequency</FieldLabel>
                      <Select
                        value={categoryForm.frequency}
                        onValueChange={(v) =>
                          setCategoryForm((f) => ({
                            ...f,
                            frequency: (v ?? "annual") as FeeCategory["frequency"],
                          }))
                        }
                      >
                        <SelectTrigger id="cat-frequency" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="cat-amount">Default Amount</FieldLabel>
                      <Input
                        id="cat-amount"
                        type="number"
                        min={0}
                        required
                        value={categoryForm.defaultAmount}
                        onChange={(e) => setCategoryForm((v) => ({ ...v, defaultAmount: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Applicable Classes</FieldLabel>
                    <div className="grid max-h-40 grid-cols-2 gap-2 scrollbar-thin overflow-y-auto rounded-md border p-3">
                      {classes.map((cls) => (
                        <label key={cls.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={categoryForm.applicableClassIds.includes(cls.id)}
                            onCheckedChange={(checked) => toggleClassId(cls.id, !!checked)}
                          />
                          {cls.name}
                        </label>
                      ))}
                    </div>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCategoryFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Category</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={categoryColumns}
            data={categories}
            onRowClick={(cat) => setSelectedCategoryId(cat.id)}
            emptyTitle="No fee categories"
            emptyDescription="Add a fee category to get started."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Installments{selectedCategory ? ` — ${selectedCategory.name}` : ""}</CardTitle>
            <CardDescription>
              {selectedCategory
                ? `Billing installments configured for ${selectedCategory.name}.`
                : "Select a category above to view its installments."}
            </CardDescription>
          </div>
          <Dialog open={installmentFormOpen} onOpenChange={setInstallmentFormOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" disabled={!selectedCategoryId} />}>
              <PlusIcon data-icon="inline-start" />
              Add Installment
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Installment</DialogTitle>
                <DialogDescription>
                  Add a new billing installment for {selectedCategory?.name ?? "this category"}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddInstallment} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="inst-label">Label</FieldLabel>
                    <Input
                      id="inst-label"
                      required
                      value={installmentForm.label}
                      onChange={(e) => setInstallmentForm((v) => ({ ...v, label: e.target.value }))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="inst-due">Due Date</FieldLabel>
                      <Input
                        id="inst-due"
                        type="date"
                        required
                        value={installmentForm.dueDate}
                        onChange={(e) => setInstallmentForm((v) => ({ ...v, dueDate: e.target.value }))}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="inst-amount">Amount</FieldLabel>
                      <Input
                        id="inst-amount"
                        type="number"
                        min={0}
                        required
                        value={installmentForm.amount}
                        onChange={(e) => setInstallmentForm((v) => ({ ...v, amount: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="inst-section">Class & Section</FieldLabel>
                    <Select
                      value={installmentForm.classSectionId}
                      onValueChange={(v) => setInstallmentForm((f) => ({ ...f, classSectionId: v ?? "" }))}
                    >
                      <SelectTrigger id="inst-section" className="w-full">
                        <SelectValue placeholder="Select class & section" />
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
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInstallmentFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Installment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={installmentColumns}
            data={installmentsForCategory}
            emptyTitle="No installments"
            emptyDescription="This category has no billing installments yet."
          />
        </CardContent>
      </Card>
    </div>
  )
}
