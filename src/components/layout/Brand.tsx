import { CONTENT } from '@/config/content'

/** Draws the configured product mark without loading an external image. */
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 30 34" fill="none" aria-hidden="true">
      <path
        d="M15 2 27 7v9c0 8-7 13-12 16C10 29 3 24 3 16V7L15 2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 10h-8a3.5 3.5 0 0 0 0 7h4a3.5 3.5 0 0 1 0 7H9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
/** Combines the Sentinel mark and name in the workspace navigation. */
export function Brand() {
  return (
    <div className="brand">
      <BrandMark />
      <span className="brand-word">
        {CONTENT.brand.name.toLowerCase()}
        <span style={{ color: 'var(--brand)' }}>.</span>
      </span>
    </div>
  )
}
