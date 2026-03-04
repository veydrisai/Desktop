export const MODULE_IDS = ['performance', 'analytics', 'nurture', 'review', 'system'] as const
export type ModuleId = (typeof MODULE_IDS)[number]

export const DEFAULT_CLIENT_MODULES: ModuleId[] = ['performance', 'analytics', 'system']

export const MODULES_NAV: { id: ModuleId; href: string; label: string }[] = [
  { id: 'performance', href: '/dashboard', label: 'Performance' },
  { id: 'analytics', href: '/dashboard/analytics', label: 'Conversation Analytics' },
  { id: 'nurture', href: '/dashboard/nurture', label: 'Nurture Pro' },
  { id: 'review', href: '/dashboard/review', label: 'Review Booster' },
  { id: 'system', href: '/dashboard/system', label: 'System' },
]

export function getModulesForNav(allowedModules: string[] | undefined, isAdmin: boolean) {
  if (isAdmin) return MODULES_NAV
  const set = new Set(allowedModules ?? DEFAULT_CLIENT_MODULES)
  return MODULES_NAV.filter((m) => set.has(m.id))
}
