export function calcAge(dob: string, reference: Date): number {
  const birth = new Date(dob)
  let age = reference.getFullYear() - birth.getFullYear()
  const m = reference.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && reference.getDate() < birth.getDate())) age--
  return age
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
