import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import type { Finding } from '../../../types'
import { DEMO_DATE } from '../../../lib/constants'
import { CONTENT } from '../../../config/content'

/** Groups findings by UTC day and plots discovered and resolved totals for the selected window. */
export function FindingsChart({
  findings,
  days,
  setDays,
}: {
  findings: Finding[]
  days: number
  setDays: (days: number) => void
}) {
  const data = Array.from({ length: days }, (_, i) => {
    const day = new Date(DEMO_DATE)
    day.setUTCDate(day.getUTCDate() - days + 1 + i)
    const key = day.toISOString().slice(0, 10)
    const matches = findings.filter((finding) => finding.discoveredAt.startsWith(key))
    return {
      date: day.toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' }),
      discovered: matches.length,
      resolved: matches.filter((finding) => finding.status === 'resolved').length,
    }
  })
  const resolved = data.reduce((total, item) => total + item.resolved, 0)
  const discovered = data.reduce((total, item) => total + item.discovered, 0)
  return (
    <section className="panel" aria-label={CONTENT.dashboard.chartTitle}>
      <div className="panel-heading">
        <div>
          <h2>{CONTENT.dashboard.chartTitle}</h2>
          <p>{CONTENT.dashboard.chartDescription}</p>
        </div>
        <div className="select-wrap">
          <label htmlFor="chart-period" className="sr-only">
            {CONTENT.dashboard.chartRange}
          </label>
          <select
            className="subtle-select"
            id="chart-period"
            value={days}
            onChange={(event) => {
              setDays(Number(event.target.value))
            }}
          >
            {[7, 14, 30].map((range) => (
              <option key={range} value={range}>
                {CONTENT.dashboard.datePresets.replace('{days}', String(range))}
              </option>
            ))}
          </select>
          <ChevronDown size={11} aria-hidden="true" />
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-line" aria-hidden="true" />
          {CONTENT.dashboard.chartDiscovered}
        </span>
        <span>
          <i className="legend-line resolved" aria-hidden="true" />
          {CONTENT.dashboard.chartResolved}
        </span>
      </div>
      <div
        className="chart-wrap"
        role="img"
        aria-label={CONTENT.dashboard.chartAria
          .replace('{discovered}', String(discovered))
          .replace('{resolved}', String(resolved))
          .replace('{days}', String(days))}
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 200 }}>
          <LineChart data={data} margin={{ top: 15, right: 13, left: -22, bottom: 5 }}>
            <CartesianGrid
              stroke="var(--muted-foreground)"
              strokeOpacity={0.2}
              strokeDasharray="3 4"
              vertical={false}
            />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={30} dy={6} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tickCount={5} />
            <Tooltip
              contentStyle={{
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 11,
                fontFamily: 'var(--font-body)',
              }}
            />
            <Line
              type="monotone"
              dataKey="discovered"
              name={CONTENT.dashboard.chartDiscovered}
              stroke="var(--blue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 3, stroke: 'var(--background)' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              name={CONTENT.dashboard.chartResolved}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <span>
          {resolved} {CONTENT.dashboard.chartSummary} {discovered} {CONTENT.dashboard.chartPeriod}
        </span>
      </div>
    </section>
  )
}
