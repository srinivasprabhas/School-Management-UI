import {
  BanknoteIcon,
  CreditCardIcon,
  FileTextIcon,
  LandmarkIcon,
  SmartphoneIcon,
  type LucideIcon,
} from "lucide-react"

import type { PaymentMode } from "@/lib/data/types"

export interface PaymentModeOption {
  value: PaymentMode
  label: string
  icon: LucideIcon
}

export const PAYMENT_MODE_OPTIONS: PaymentModeOption[] = [
  { value: "cash", label: "Cash", icon: BanknoteIcon },
  { value: "card", label: "Card", icon: CreditCardIcon },
  { value: "upi", label: "UPI", icon: SmartphoneIcon },
  { value: "bank_transfer", label: "Bank Transfer", icon: LandmarkIcon },
  { value: "cheque", label: "Cheque", icon: FileTextIcon },
]

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
}
