import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'

/** Shares a short hover delay across related controls without changing their focus behavior. */
export function TooltipProvider({
  delayDuration = 200,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

/** Keeps tooltip visibility scoped to the control it describes. */
export function Tooltip(props: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />
}

/** Uses the existing link or button as the trigger instead of nesting another button. */
export function TooltipTrigger(props: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />
}

/** Portals the label above dialogs while leaving the trigger's accessible name intact. */
export function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn('app-tooltip', className)}
        sideOffset={sideOffset}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

/** Adds one consistent shadcn-style hint to an icon-only or collapsed control. */
export function IconHint({
  label,
  children,
  side = 'top',
  enabled = true,
}: {
  label: string
  children: ReactElement
  side?: ComponentProps<typeof TooltipPrimitive.Content>['side']
  enabled?: boolean
}) {
  if (!enabled) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
