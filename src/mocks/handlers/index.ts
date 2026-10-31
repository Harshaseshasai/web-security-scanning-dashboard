import { targetsHandlers } from './targets.handlers'
import { scansHandlers } from './scans.handlers'
import { findingsHandlers } from './findings.handlers'
import { reportsHandlers } from './reports.handlers'
import { authHandlers } from './auth.handlers'
import { workspaceHandlers } from './workspaces.handlers'

export const handlers = [
  ...authHandlers,
  ...workspaceHandlers,
  ...targetsHandlers,
  ...scansHandlers,
  ...findingsHandlers,
  ...reportsHandlers,
]
