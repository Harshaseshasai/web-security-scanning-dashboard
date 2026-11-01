import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { IconHint } from './Tooltip'
import { CONTENT } from '@/config/content'

/** Focus-traps workflow dialogs and returns focus to their original trigger. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}) {
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          tabIndex={-1}
          className={`modal-content ${wide ? 'modal-wide' : ''}`}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            returnFocus.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null
            document.querySelector<HTMLElement>('.modal-content[tabindex="-1"]')?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (returnFocus.current?.isConnected === true) returnFocus.current.focus()
            else document.querySelector<HTMLElement>('#main')?.focus()
          }}
        >
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <IconHint label={CONTENT.common.closeDialog}>
              <Dialog.Close className="icon-button" aria-label={CONTENT.common.closeDialog}>
                <X size={19} aria-hidden="true" />
              </Dialog.Close>
            </IconHint>
          </div>
          <Dialog.Description
            className={description !== undefined ? 'modal-description' : 'sr-only'}
          >
            {description ?? title}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
