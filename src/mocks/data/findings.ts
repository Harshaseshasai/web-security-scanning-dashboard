import { z } from 'zod'
import { FindingSchema } from '../../schemas/finding.schema'
import { targets } from './targets'

const templates = [
  [
    'SQL injection in search endpoint',
    'A03: Injection',
    'CWE-89',
    '/api/v1/search?q=test%27',
    'User-controlled input is concatenated into a database query without parameterization. An attacker could read or modify sensitive application data.',
    'Replace string concatenation with parameterized queries. Apply least-privilege database permissions and validate all user input.',
  ],
  [
    'Cross-site scripting (reflected)',
    'A03: Injection',
    'CWE-79',
    '/search?query=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
    'The application reflects unsanitized user input in an HTML response, allowing arbitrary JavaScript execution in the browser.',
    'Encode output for its HTML context. Use framework auto-escaping and deploy a strict Content-Security-Policy.',
  ],
  [
    'Broken access control on user API',
    'A01: Broken Access Control',
    'CWE-284',
    '/api/v1/users/12',
    "A lower-privileged user can access another user's record by changing the resource identifier.",
    'Enforce server-side authorization on every resource. Deny access by default and verify object ownership.',
  ],
  [
    'Sensitive data exposed in response',
    'A02: Cryptographic Failures',
    'CWE-200',
    '/api/v1/account',
    'The response includes sensitive account properties that are not required by the client.',
    'Use explicit response schemas. Remove sensitive fields and avoid serializing database entities directly.',
  ],
  [
    'Outdated dependency detected',
    'A06: Vulnerable and Outdated Components',
    'CWE-1104',
    '/assets/vendor.js',
    'A client-side dependency with known vulnerabilities was identified in the application bundle.',
    'Upgrade to a supported release and introduce automated dependency scanning in the build pipeline.',
  ],
  [
    'Missing Content-Security-Policy',
    'A05: Security Misconfiguration',
    'CWE-693',
    '/',
    'The response does not include a Content-Security-Policy header, reducing protection against script injection.',
    'Configure a restrictive Content-Security-Policy with per-request nonces. Roll it out in report-only mode first.',
  ],
  [
    'Session cookie missing Secure flag',
    'A07: Identification and Authentication Failures',
    'CWE-614',
    '/auth/login',
    'The session cookie is issued without the Secure attribute and may be sent over an unencrypted connection.',
    'Set Secure, HttpOnly, and an appropriate SameSite policy on all session cookies.',
  ],
  [
    'Cross-site request forgery',
    'A01: Broken Access Control',
    'CWE-352',
    '/api/v1/settings',
    'A state-changing endpoint accepts requests without validating an anti-CSRF token or origin.',
    'Validate a per-session CSRF token and check the Origin header for state-changing requests.',
  ],
  [
    'Verbose error message disclosure',
    'A05: Security Misconfiguration',
    'CWE-209',
    '/api/v1/debug',
    'An error response exposes internal stack traces, file paths, and framework details.',
    'Return generic client-facing error messages and send diagnostic details to restricted server-side logs.',
  ],
  [
    'Server-side request forgery',
    'A10: Server-Side Request Forgery',
    'CWE-918',
    '/api/v1/import',
    'The URL import endpoint can be directed to internal network resources.',
    'Allowlist destinations, block private and link-local networks, and validate resolved addresses before connecting.',
  ],
  [
    'Missing HTTP Strict-Transport-Security',
    'A02: Cryptographic Failures',
    'CWE-319',
    '/',
    'The server does not advertise an HSTS policy to enforce encrypted connections.',
    'Enable HSTS with a suitable max-age after confirming all subdomains support HTTPS.',
  ],
  [
    'Server version header exposed',
    'A05: Security Misconfiguration',
    'CWE-497',
    '/',
    'HTTP response headers disclose the web server version and technology stack.',
    'Remove version-identifying response headers and disable framework debug output in production.',
  ],
]

// Each response supports the specific weakness above rather than repeating a generic success body.
const responseSamples = [
  'HTTP/1.1 500 Internal Server Error\nContent-Type: application/json\n\n{"error":"SQL syntax error near test\'"}',
  'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<div>Results for <script>alert(1)</script></div>',
  'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":12,"email":"another-user@westhaven.example"}',
  'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"email":"analyst@westhaven.example","internalToken":"[redacted]"}',
  'HTTP/1.1 200 OK\nContent-Type: text/javascript\n\n/*! legacy-vendor v1.2.3 */',
  'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<!doctype html><title>Westhaven</title>',
  'HTTP/1.1 200 OK\nSet-Cookie: session=redacted; HttpOnly; SameSite=Lax\n\n{"authenticated":true}',
  'HTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: *',
  'HTTP/1.1 500 Internal Server Error\nContent-Type: text/plain\n\nTraceback: /srv/app/routes/debug.py:41',
  'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"source":"http://169.254.169.254/latest/meta-data/"}',
  'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<!doctype html><title>Westhaven</title>',
  'HTTP/1.1 200 OK\nServer: nginx/1.24.0\nContent-Type: text/html\n\n<!doctype html>',
]

const dayOffsets = [6, 5, 4, 2, 5, 3, 6, 2, 4, 3, 2, 3, 2, 1].flatMap((count, offset) =>
  Array.from({ length: count }, () => offset)
)

// The generated records keep scan/target relations intact while varying severity and triage.
export const findings = z.array(FindingSchema).parse(
  Array.from({ length: 48 }, (_, i) => {
    const template = templates[i % templates.length]
    const completedScanIndex = 2 + (i % 6)
    const target = targets[completedScanIndex % targets.length]
    const severity =
      i < 4 ? 'critical' : i < 14 ? 'high' : i < 32 ? 'medium' : i < 42 ? 'low' : 'info'
    const status =
      i < 4
        ? 'open'
        : i % 9 === 0
          ? 'false_positive'
          : i % 5 === 0
            ? 'resolved'
            : i % 4 === 0
              ? 'confirmed'
              : 'open'
    return {
      id: `fnd_${5231 + i}`,
      scanId: `scan_${118 + completedScanIndex}`,
      targetId: target.id,
      title: template[0],
      severity,
      category: template[1],
      cwe: template[2],
      status,
      location: `${target.url}${template[3]}`,
      description: template[4],
      remediation: template[5],
      evidence: {
        request: `${i % templates.length === 7 ? 'POST' : 'GET'} ${template[3]} HTTP/1.1\nHost: ${new URL(target.url).hostname}\nUser-Agent: Sentinel-Scanner/1.0\nAccept: application/json\nX-Sentinel-Test: authorized-assessment`,
        response: responseSamples[i % templates.length],
      },
      discoveredAt: new Date(
        Date.UTC(2026, 9, 31 - dayOffsets[i], 10, 24 - (i % 24))
      ).toISOString(),
    }
  })
)

for (const target of targets)
  target.openFindings = findings.filter(
    (finding) => finding.targetId === target.id && ['open', 'confirmed'].includes(finding.status)
  ).length
