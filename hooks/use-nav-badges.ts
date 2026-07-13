"use client"

import { useNotifications } from "@/lib/data/store/entities"

export function useNavBadges(): Record<string, number | undefined> {
  const { items } = useNotifications()
  const unread = items.filter((n) => !n.read).length
  return {
    notifications: unread > 0 ? unread : undefined,
  }
}
