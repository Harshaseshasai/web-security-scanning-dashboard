import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown } from 'lucide-react'
import { capitalize } from '../../lib/utils'
import { CONTENT } from '../../config/content'

/** Provides multi-select filters with OR behavior inside one dimension. */
export function FilterMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label?: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  /** Toggles one value while preserving the other selections within this filter dimension. */
  const toggleOption = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option]
    )
  }

  return (
    <Popover.Root>
      <Popover.Trigger className={`filter-button ${selected.length ? 'filter-active' : ''}`}>
        {label}
        {selected.length > 0 && <span className="filter-count">{selected.length}</span>}
        <ChevronDown size={13} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover-content filter-popover" align="start" sideOffset={7}>
          <div className="popover-label">
            {CONTENT.findings.filterBy} {label.toLowerCase()}
          </div>
          {options.map((option) => (
            <label key={option.value} className="filter-option">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => {
                  toggleOption(option.value)
                }}
              />
              <span>{option.label ?? capitalize(option.value)}</span>
              {selected.includes(option.value) && <Check size={14} />}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              className="filter-clear"
              onClick={() => {
                onChange([])
              }}
            >
              {CONTENT.findings.clearSelection}
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
