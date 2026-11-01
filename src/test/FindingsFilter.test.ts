import { describe, it, expect } from 'vitest'
import { filterFindings, readFilters } from '../lib/findings-filter'
import { FilterSchema, SeveritySchema } from '../schemas/finding.schema'
import { findings } from '../mocks/data/findings'
import { SEVERITY_ORDER } from '../lib/constants'

const defaults = FilterSchema.parse({})
describe('filterFindings', () => {
  it('returns all findings without filters', () => {
    expect(filterFindings(findings, defaults).all).toEqual(findings)
  })
  it('filters a single severity', () => {
    expect(filterFindings(findings, { ...defaults, severity: ['critical'] }).total).toBe(4)
  })
  it('uses OR logic within severity', () => {
    expect(filterFindings(findings, { ...defaults, severity: ['critical', 'high'] }).total).toBe(14)
  })
  it('uses AND logic between severity and status', () => {
    expect(
      filterFindings(findings, { ...defaults, severity: ['critical'], status: ['resolved'] }).total
    ).toBe(0)
  })
  it.each(['SQL INJECTION', 'CWE-89', '/api/v1/search', 'parameterization'])(
    'searches the correct fields for %s',
    (search) => {
      expect(filterFindings(findings, { ...defaults, search }).total).toBeGreaterThan(0)
    }
  )
  it('combines all dimensions', () => {
    const filters = {
      ...defaults,
      severity: ['critical'],
      category: ['A03: Injection'],
      status: ['open'],
      target: 'tgt_03',
      search: 'sql',
    }
    expect(filterFindings(findings, filters).all).toEqual([findings[0]])
  })
  it('filters by scan ID', () => {
    expect(
      filterFindings(findings, { ...defaults, scan: 'scan_120' }).all.every(
        (finding) => finding.scanId === 'scan_120'
      )
    ).toBe(true)
  })
  it('sorts ascending severity in the explicit order', () => {
    const rows = filterFindings([...findings].reverse(), {
      ...defaults,
      sort: 'severity',
      direction: 'asc',
    }).all
    expect(rows.map((finding) => SEVERITY_ORDER[finding.severity])).toEqual(
      rows.map((finding) => SEVERITY_ORDER[finding.severity]).sort((a, b) => a - b)
    )
  })
  it('sorts descending severity', () => {
    expect(
      filterFindings(findings, { ...defaults, sort: 'severity', direction: 'desc' }).rows[0]
        .severity
    ).toBe('info')
  })
  it.each(['title', 'category', 'cwe', 'targetId', 'status', 'discoveredAt'])(
    'sorts column %s',
    (sort) => {
      const asc = filterFindings(findings, { ...defaults, sort, direction: 'asc' }).all
      const desc = filterFindings(findings, { ...defaults, sort, direction: 'desc' }).all
      expect(asc[0][sort as keyof (typeof asc)[0]]).toEqual(
        desc[desc.length - 1][sort as keyof (typeof asc)[0]]
      )
    }
  )
  it('returns the correct second page', () => {
    expect(filterFindings(findings, { ...defaults, page: 2 }).rows).toEqual(findings.slice(20, 40))
  })
  it.each(['something-impossible', 'C++', '[test]', '.*', '\\'])(
    'handles literal search %s safely',
    (search) => {
      expect(filterFindings(findings, { ...defaults, search }).total).toBe(0)
    }
  )
  it('handles whitespace search', () => {
    expect(filterFindings(findings, { ...defaults, search: '  ' }).total).toBe(48)
  })
  it('handles invalid severity', () => {
    expect(filterFindings(findings, { ...defaults, severity: ['extreme'] }).total).toBe(0)
  })
  it('returns an empty slice on an out-of-bounds page', () => {
    expect(filterFindings(findings, { ...defaults, page: 999 }).rows).toEqual([])
  })
  it('handles an empty dataset', () => {
    expect(filterFindings([], defaults).rows).toEqual([])
  })
  it('treats all severities like no severity filter', () => {
    expect(
      filterFindings(findings, { ...defaults, severity: [...SeveritySchema.options] }).all
    ).toEqual(findings)
  })
  it('reset restores all findings', () => {
    expect(filterFindings(findings, FilterSchema.parse({})).total).toBe(48)
  })
  it('unknown sort columns are harmless', () => {
    expect(filterFindings(findings, { ...defaults, sort: 'invalid', direction: 'asc' }).total).toBe(
      48
    )
  })
})
describe('readFilters', () => {
  it('parses a shareable URL', () => {
    expect(
      readFilters(
        new URLSearchParams(
          'search=sql&severity=critical,high&status=open&page=2&category=A03%3A+Injection&target=tgt_01&direction=asc&sort=title&scan=scan_120'
        )
      )
    ).toMatchObject({
      search: 'sql',
      severity: ['critical', 'high'],
      status: ['open'],
      page: 2,
      category: ['A03: Injection'],
      target: 'tgt_01',
      direction: 'asc',
      sort: 'title',
      scan: 'scan_120',
    })
  })
  it.each(['page=-4', 'page=wat', 'page=0', 'direction=random', ''])(
    'normalizes invalid URL parameters %s',
    (query) => {
      expect(readFilters(new URLSearchParams(query))).toMatchObject({ page: 1, direction: 'none' })
    }
  )
  it('parses descending order', () => {
    expect(readFilters(new URLSearchParams('direction=desc')).direction).toBe('desc')
  })
})
