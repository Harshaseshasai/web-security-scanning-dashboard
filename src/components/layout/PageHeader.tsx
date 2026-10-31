import type { ReactNode } from 'react'

/** Keeps the page title, operational context, and primary action aligned. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions !== undefined && <div className="page-actions">{actions}</div>}
    </div>
  )
}
