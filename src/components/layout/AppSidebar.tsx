import { Link, NavLink } from 'react-router-dom'
import { ChevronsUpDown, CircleHelp, LogOut, Settings2 } from 'lucide-react'
import { Brand } from './Brand'
import { useUiStore } from '../../store/ui.store'
import { useAuthStore } from '../../store/auth.store'
import { useFindings, useScans } from '../../hooks/use-data'
import { useWorkspace } from '../../hooks/use-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useFindingStore } from '../../store/findings-filter.store'
import { IconHint } from '../ui/Tooltip'
import { useCompactNavigation } from '../../hooks/use-compact-navigation'
import { CONTENT } from '../../config/content'
import { MAIN_NAVIGATION } from '../../config/navigation.config'
import { initials } from '../../lib/utils'

/** Connects API-derived workspace identity to responsive, tooltip-labeled navigation. */
export function AppSidebar() {
  const mobileOpen = useUiStore((state) => state.mobileOpen)
  const collapsed = useUiStore((state) => state.collapsed)
  const narrow = useCompactNavigation()
  const iconOnly = (collapsed || narrow) && !mobileOpen
  const setMobileOpen = useUiStore((state) => state.setMobileOpen)
  const openModal = useUiStore((state) => state.openModal)
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const workspace = useWorkspace(session?.workspaceId ?? '')
  const queryClient = useQueryClient()
  const { data: findings } = useFindings()
  const { data: scans } = useScans()
  const activeCount =
    scans?.filter((scan) => ['running', 'queued'].includes(scan.status)).length ?? 0
  const workspaceName = workspace.data?.name ?? CONTENT.navigation.workspaceLoading
  const workspacePlan = workspace.data?.plan ?? CONTENT.navigation.workspaceLoading
  const userName = session?.user.name ?? CONTENT.navigation.userFallback

  /** Clears authenticated and session-only findings data before routing to login. */
  const handleSignOut = () => {
    signOut()
    useFindingStore.getState().reset()
    queryClient.clear()
  }

  return (
    <>
      {mobileOpen && (
        <button
          className="mobile-overlay"
          onClick={() => {
            setMobileOpen(false)
          }}
          aria-label={CONTENT.navigation.closeNavigation}
        />
      )}
      <aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label={CONTENT.navigation.sidebarLabel}
      >
        <IconHint
          label={CONTENT.brand.homeLabel}
          side="right"
          enabled={iconOnly}
        >
          <Link
            to="/dashboard"
            aria-label={CONTENT.brand.homeLabel}
            onClick={() => {
              setMobileOpen(false)
            }}
          >
            <Brand />
          </Link>
        </IconHint>
        <IconHint label={workspaceName} side="right" enabled={iconOnly}>
          <button
            className="workspace-switch"
            onClick={() => {
              openModal('workspace')
            }}
            aria-label={CONTENT.navigation.workspaceDetails}
          >
            <span className="workspace-avatar">{initials(workspaceName)}</span>
            <span className="workspace-info">
              {workspaceName}
              <small>{workspacePlan}</small>
            </span>
            <ChevronsUpDown size={13} aria-hidden="true" />
          </button>
        </IconHint>
        <p className="nav-label">{CONTENT.navigation.workspaceLabel}</p>
        <nav aria-label={CONTENT.navigation.mainLabel}>
          {MAIN_NAVIGATION.map(({ to, label, icon: Icon }) => (
            <IconHint key={to} label={label} side="right" enabled={iconOnly}>
              <NavLink
                to={to}
                aria-label={label}
                onClick={() => {
                  setMobileOpen(false)
                }}
                className="nav-link"
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {to === '/scans' && activeCount > 0 && (
                  <span className="nav-count nav-count-live" aria-hidden="true">
                    {activeCount}
                  </span>
                )}
                {to === '/findings' && findings && (
                  <span className="nav-count" aria-hidden="true">
                    {findings.length}
                  </span>
                )}
              </NavLink>
            </IconHint>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <IconHint label={CONTENT.navigation.settings} side="right" enabled={iconOnly}>
            <button
              className="nav-link"
              onClick={() => {
                openModal('settings')
              }}
              aria-label={CONTENT.navigation.settings}
            >
              <Settings2 aria-hidden="true" />
              <span>{CONTENT.navigation.settings}</span>
            </button>
          </IconHint>
          <IconHint label={CONTENT.navigation.help} side="right" enabled={iconOnly}>
            <button
              className="nav-link"
              onClick={() => {
                openModal('help')
              }}
              aria-label={CONTENT.navigation.help}
            >
              <CircleHelp aria-hidden="true" />
              <span>{CONTENT.navigation.help}</span>
            </button>
          </IconHint>
          <div className="sidebar-user">
            <span className="avatar">{initials(userName)}</span>
            <div className="user-name">
              {userName}
              <small>{session?.user.role ?? CONTENT.workspace.roleFallback}</small>
            </div>
            <IconHint label={CONTENT.navigation.signOut} side="right">
              <button
                className="icon-button"
                aria-label={CONTENT.navigation.signOut}
                onClick={handleSignOut}
              >
                <LogOut size={15} aria-hidden="true" />
              </button>
            </IconHint>
          </div>
        </div>
      </aside>
    </>
  )
}
