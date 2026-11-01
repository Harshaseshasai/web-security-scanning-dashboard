import { z } from 'zod'
import { ScanSchema } from '../../schemas/scan.schema'
import { targets } from './targets'
import { findings } from './findings'

export const scans = z.array(ScanSchema).parse(
  Array.from({ length: 12 }, (_, i) => {
    const status = i === 0 ? 'running' : i === 1 ? 'queued' : i === 8 ? 'failed' : 'completed'
    const scanFindings = findings.filter((finding) => finding.scanId === `scan_${String(118 + i)}`)
    return {
      id: `scan_${String(118 + i)}`,
      targetId: targets[i % targets.length].id,
      status,
      progress: i === 0 ? 45 : i === 1 ? 0 : i === 8 ? 72 : 100,
      startedAt: new Date(
        Date.UTC(2026, 9, 31 - Math.floor(i / 4), 10 - (i % 4), 28)
      ).toISOString(),
      durationSec: status === 'completed' ? 120 + i * 37 : null,
      findingsCount: {
        critical: scanFindings.filter((f) => f.severity === 'critical').length,
        high: scanFindings.filter((f) => f.severity === 'high').length,
        medium: scanFindings.filter((f) => f.severity === 'medium').length,
        low: scanFindings.filter((f) => f.severity === 'low').length,
      },
    }
  })
)
