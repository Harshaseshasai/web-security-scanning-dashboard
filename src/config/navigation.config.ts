import { Crosshair, Files, LayoutDashboard, ScanLine, ShieldAlert } from 'lucide-react'
import { CONTENT } from './content'

/** Routes and navigation labels are configuration, not shell markup. */
export const MAIN_NAVIGATION = [
  { to: '/dashboard', label: CONTENT.dashboard.overviewTab, icon: LayoutDashboard },
  { to: '/targets', label: CONTENT.targets.title, icon: Crosshair },
  { to: '/scans', label: CONTENT.scans.title, icon: ScanLine },
  { to: '/findings', label: CONTENT.findings.title, icon: ShieldAlert },
  { to: '/reports', label: CONTENT.reports.title, icon: Files },
] as const
