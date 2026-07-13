"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldContent, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type FineType = "flat" | "percentage"

export function FinesTab() {
  const [fineType, setFineType] = useState<FineType>("percentage")
  const [flatAmount, setFlatAmount] = useState("100")
  const [percentage, setPercentage] = useState("2")
  const [graceDays, setGraceDays] = useState("7")

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    toast.success("Fine rules saved", {
      description:
        fineType === "flat"
          ? `Flat fine of ₹${flatAmount} applies after a ${graceDays}-day grace period.`
          : `${percentage}% fine applies after a ${graceDays}-day grace period.`,
    })
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Late Fine Rules</CardTitle>
        <CardDescription>
          Configure how late-payment fines are calculated for overdue fee transactions. This is a demo
          settings form — values are not persisted.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Fine Type</FieldLabel>
              <RadioGroup
                value={fineType}
                onValueChange={(v) => v && setFineType(v as FineType)}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <FieldLabel htmlFor="fine-flat">
                  <Field orientation="horizontal">
                    <RadioGroupItem value="flat" id="fine-flat" />
                    <FieldContent>
                      <FieldTitle>Flat Amount</FieldTitle>
                      <FieldDescription>A fixed fine regardless of balance.</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="fine-percentage">
                  <Field orientation="horizontal">
                    <RadioGroupItem value="percentage" id="fine-percentage" />
                    <FieldContent>
                      <FieldTitle>Percentage</FieldTitle>
                      <FieldDescription>A percentage of the outstanding balance.</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </Field>

            {fineType === "flat" ? (
              <Field>
                <FieldLabel htmlFor="flat-amount">Flat Fine Amount (₹)</FieldLabel>
                <Input
                  id="flat-amount"
                  type="number"
                  min={0}
                  value={flatAmount}
                  onChange={(e) => setFlatAmount(e.target.value)}
                  className="max-w-40"
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="fine-percentage-value">Fine Percentage (%)</FieldLabel>
                <Input
                  id="fine-percentage-value"
                  type="number"
                  min={0}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="max-w-40"
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="grace-days">Grace Period (days)</FieldLabel>
              <Input
                id="grace-days"
                type="number"
                min={0}
                value={graceDays}
                onChange={(e) => setGraceDays(e.target.value)}
                className="max-w-40"
              />
              <FieldDescription>
                Number of days after the due date before a fine is applied.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save Rules</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
