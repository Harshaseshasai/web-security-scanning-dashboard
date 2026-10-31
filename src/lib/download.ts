import type { Finding } from '../types'

/** Creates a temporary object URL and releases it after starting a browser download. */
export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

/** Quotes finding fields and neutralizes spreadsheet formulas before CSV export. */
export function findingsCsv(findings: Finding[]) {
  /** Escapes CSV quotes and formula-leading characters in an individual cell. */
  const cell = (value: string) => `"${value.replace(/"/g, '""').replace(/^[=+@\-\t\r]/, "'$&")}"`
  return [
    'ID,Title,Severity,Status,Category,CWE,Location,Discovered',
    ...findings.map((finding) =>
      [
        finding.id,
        finding.title,
        finding.severity,
        finding.status,
        finding.category,
        finding.cwe,
        finding.location,
        finding.discoveredAt,
      ]
        .map(cell)
        .join(',')
    ),
  ].join('\r\n')
}
