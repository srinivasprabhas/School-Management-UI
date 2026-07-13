/** Deterministic seeded PRNG (mulberry32) so mock data looks the same across reloads. */
export function createRng(seed: number) {
  let a = seed >>> 0

  function next(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min
    },
    float(min: number, max: number, decimals = 2): number {
      const value = next() * (max - min) + min
      const factor = 10 ** decimals
      return Math.round(value * factor) / factor
    },
    bool(trueChance = 0.5): boolean {
      return next() < trueChance
    },
    item<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)]
    },
    items<T>(arr: readonly T[], count: number): T[] {
      const pool = [...arr]
      const result: T[] = []
      for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = Math.floor(next() * pool.length)
        result.push(pool[idx])
        pool.splice(idx, 1)
      }
      return result
    },
    dateBetween(start: Date, end: Date): Date {
      const t = start.getTime() + next() * (end.getTime() - start.getTime())
      return new Date(t)
    },
  }
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

export function pad(num: number, width: number): string {
  return String(num).padStart(width, "0")
}
