import { z } from 'zod'
import { ReportSchema } from '../../schemas/report.schema'
import { scans } from './scans'
import { targets } from './targets'
import { findings } from './findings'

/** Seed reports follow the exact GET /api/reports contract. */
export const reports = z.array(ReportSchema).parse(
  scans
    .filter((scan) => scan.status === 'completed')
    .slice(0, 4)
    .map((scan, i) => ({
      id: `rpt_${String(9 + i).padStart(2, '0')}`,
      scanId: scan.id,
      target: targets.find((target) => target.id === scan.targetId)?.name ?? scan.targetId,
      createdAt: scan.startedAt,
      findings: findings.filter((finding) => finding.scanId === scan.id).length,
      format: 'pdf',
    }))
)
