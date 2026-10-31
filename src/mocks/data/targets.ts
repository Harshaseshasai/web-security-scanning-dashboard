import { z } from 'zod'
import { TargetSchema } from '../../schemas/target.schema'

export const targets = z.array(TargetSchema).parse([
  {
    id: 'tgt_01',
    name: 'Customer application',
    url: 'https://app.westhaven.example',
    environment: 'production',
    authenticated: true,
    lastScannedAt: '2026-10-31T10:28:00Z',
    openFindings: 12,
  },
  {
    id: 'tgt_02',
    name: 'Checkout API',
    url: 'https://api.westhaven.example',
    environment: 'production',
    authenticated: true,
    lastScannedAt: '2026-10-31T09:46:00Z',
    openFindings: 9,
  },
  {
    id: 'tgt_03',
    name: 'Public website',
    url: 'https://www.westhaven.example',
    environment: 'production',
    authenticated: false,
    lastScannedAt: '2026-10-31T08:14:00Z',
    openFindings: 4,
  },
  {
    id: 'tgt_04',
    name: 'Partner portal',
    url: 'https://partners.westhaven.example',
    environment: 'staging',
    authenticated: true,
    lastScannedAt: '2026-10-30T14:20:00Z',
    openFindings: 7,
  },
  {
    id: 'tgt_05',
    name: 'Staging application',
    url: 'https://staging.westhaven.example',
    environment: 'staging',
    authenticated: false,
    lastScannedAt: '2026-10-30T11:30:00Z',
    openFindings: 3,
  },
  {
    id: 'tgt_06',
    name: 'Internal API',
    url: 'https://internal.westhaven.example',
    environment: 'dev',
    authenticated: false,
    lastScannedAt: '2026-10-30T09:34:00Z',
    openFindings: 1,
  },
])
