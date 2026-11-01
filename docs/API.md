# API

The frontend talks to `/api` through `src/lib/api.ts`. In development, MSW routes requests to `src/mocks/service.ts`; the static preview uses the same in-memory service unless `VITE_LIVE_API=true`. Successful responses are validated with strict Zod schemas. Errors use `{ "error": "..." }`.

## Assignment Contract

| Method and path         | Response    | Frontend use                           |
| ----------------------- | ----------- | -------------------------------------- |
| `GET /api/targets`      | `Target[]`  | Target list and selectors.             |
| `GET /api/scans`        | `Scan[]`    | Scan list, progress, and recent scans. |
| `GET /api/findings`     | `Finding[]` | Dashboard and findings screen.         |
| `GET /api/findings/:id` | `Finding`   | Finding detail.                        |
| `GET /api/reports`      | `Report[]`  | Generated report list.                 |

These response shapes match the assignment's Section 5 contract. Findings filtering, sorting, and pagination are performed client-side; there is no undocumented `/api/findings/query` endpoint.

## App Workflow Endpoints

The brief requires create/edit/delete and generation workflows but does not define their write routes. The demo uses:

| Method and path              | Request                                                           | Response / behavior                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/auth/config`       | None                                                              | Demo login configuration.                                                                                                      |
| `POST /api/login`            | `{ "email", "password" }`                                         | Fake token, user, and workspace ID; invalid credentials return 401.                                                            |
| `GET /api/session`           | Bearer token                                                      | Current fake session.                                                                                                          |
| `GET /api/workspaces/:id`    | Bearer token                                                      | Workspace name and plan.                                                                                                       |
| `POST /api/targets`          | Name, URL, environment, auth flag; credentials when authenticated | Created `Target`; duplicate URLs return 409. Credentials are validated, then discarded.                                        |
| `PUT /api/targets/:id`       | Same target fields                                                | Updated `Target`.                                                                                                              |
| `DELETE /api/targets/:id`    | None                                                              | `{ "success": true }`.                                                                                                         |
| `POST /api/scans`            | `{ "targetId", "profile" }`                                       | Queued `Scan`; invalid or active targets return an error.                                                                      |
| `POST /api/reports/generate` | `{ "scanId" }`                                                    | Report metadata; only completed scans are accepted. The first call deliberately returns 503 so retry handling is demonstrable. |

Protected calls carry a bearer token. Retryable creates carry an `Idempotency-Key`. A 401 clears the session and redirects to login. The mock service simulates 300–800 ms latency and keeps entities in memory only.

## Data Shapes

`Target`, `Scan`, `Finding`, and `Report` schemas live in `src/schemas/`. All response objects are strict. Important enums are:

- Environment: `staging`, `production`, `dev`.
- Scan status: `queued`, `running`, `completed`, `failed`.
- Finding severity: `critical`, `high`, `medium`, `low`, `info`.
- Finding status: `open`, `confirmed`, `resolved`, `false_positive`.

The fixture dataset contains 6 targets, 12 scans, and 48 findings. Report generation returns metadata only; the PDF download control is a placeholder by design.
