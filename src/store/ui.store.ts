import { create } from 'zustand'
import { z } from 'zod'

const ModalSchema = z
  .enum(['target', 'scan', 'report', 'help', 'notifications', 'settings', 'workspace'])
  .nullable()
export const useUiStore = create<{
  collapsed: boolean
  mobileOpen: boolean
  modal: z.infer<typeof ModalSchema>
  editTargetId: string | null
  preselectedTarget: string
  selectedRows: string[]
  setSelectedRows: (ids: string[]) => void
  toggleCollapsed: () => void
  setMobileOpen: (open: boolean) => void
  openModal: (modal: z.infer<typeof ModalSchema>, id?: string) => void
  closeModal: () => void
}>((set) => ({
  collapsed: false,
  mobileOpen: false,
  modal: null,
  editTargetId: null,
  preselectedTarget: '',
  selectedRows: [],
  /** Tracks selected finding IDs for batch actions across pages. */
  setSelectedRows: (selectedRows) => {
    set({ selectedRows })
  },
  /** Switches between labeled and icon-only desktop navigation. */
  toggleCollapsed: () => {
    set((state) => ({ collapsed: !state.collapsed }))
  },
  /** Opens or closes the mobile navigation drawer. */
  setMobileOpen: (mobileOpen) => {
    set({ mobileOpen })
  },
  /** Opens one dialog and stores any target preselection it needs. */
  openModal: (modal, id) => {
    set({
      modal,
      editTargetId: modal === 'target' ? (id ?? null) : null,
      preselectedTarget: modal === 'scan' ? (id ?? '') : '',
    })
  },
  /** Clears the active dialog and its preselected target. */
  closeModal: () => {
    set({ modal: null, editTargetId: null, preselectedTarget: '' })
  },
}))
