import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown } from 'lucide-react'
import { forwardRef, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label?: string
  disabled?: boolean
}

interface SelectProps {
  label: string
  placeholder?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  id?: string
  className?: string
  ariaDescribedBy?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    label,
    placeholder,
    options,
    value,
    onChange,
    disabled,
    required,
    id,
    className,
    ariaDescribedBy,
  },
  ref
) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const pendingOpenDirection = useRef<'up' | 'down' | null>(null)
  const contentId = id !== undefined && id !== '' ? `${id}-content` : undefined
  const enabledIndices = options.reduce<number[]>((indices, option, index) => {
    if (disabled !== true && option.disabled !== true) indices.push(index)
    return indices
  }, [])
  const focusOption = (index: number) => {
    setActiveIndex(index)
    optionRefs.current[index]?.focus()
  }
  const focusInitialOption = (event: Event) => {
    if (enabledIndices.length === 0) return
    const selectedIndex = enabledIndices.find((index) => options[index].value === value)
    const firstIndex = enabledIndices[0]
    const lastIndex = enabledIndices[enabledIndices.length - 1]
    const index = selectedIndex ?? (pendingOpenDirection.current === 'up' ? lastIndex : firstIndex)
    pendingOpenDirection.current = null
    event.preventDefault()
    focusOption(index)
  }
  const moveOption = (direction: -1 | 1) => {
    if (enabledIndices.length === 0) return
    const currentPosition = enabledIndices.indexOf(activeIndex)
    const nextPosition =
      currentPosition === -1
        ? 0
        : (currentPosition + direction + enabledIndices.length) % enabledIndices.length
    focusOption(enabledIndices[nextPosition])
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          ref={ref}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={contentId}
          aria-label={label}
          aria-required={required}
          aria-disabled={disabled}
          aria-describedby={ariaDescribedBy}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            pendingOpenDirection.current = event.key === 'ArrowUp' ? 'up' : 'down'
            setOpen(true)
          }}
          className={cn(
            'filter-button',
            className,
            value !== '' && 'filter-active',
            disabled === true && 'opacity-50'
          )}
          disabled={disabled}
        >
          <span className="select-trigger-text">
            {value
              ? (options.find((opt) => opt.value === value)?.label ??
                options.find((opt) => opt.value === value)?.value)
              : (placeholder ?? label)}
          </span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          id={contentId}
          role="listbox"
          aria-label={label}
          className={cn('popover-content filter-popover select-popover', className)}
          align="start"
          sideOffset={7}
          onOpenAutoFocus={focusInitialOption}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              moveOption(1)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              moveOption(-1)
            } else if (event.key === 'Home' && enabledIndices.length > 0) {
              event.preventDefault()
              focusOption(enabledIndices[0])
            } else if (event.key === 'End' && enabledIndices.length > 0) {
              event.preventDefault()
              focusOption(enabledIndices[enabledIndices.length - 1])
            }
          }}
        >
          <div className="popover-label">{label}</div>
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={cn('filter-option select-option', value === option.value && 'selected')}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              disabled={disabled || option.disabled}
            >
              <span className="select-option-label">{option.label ?? option.value}</span>
              {value === option.value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
})

Select.displayName = 'Select'
