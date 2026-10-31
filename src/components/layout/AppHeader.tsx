import { Bell, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/ui.store'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { IconHint } from '../ui/Tooltip'
import { useFindings, useScans } from '../../hooks/use-data'
import { CONTENT } from '../../config/content'

/** Connects breadcrumbs, finding search, and contextual icon actions to the workspace. */
export function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const openModal = useUiStore((state) => state.openModal)
  const toggleCollapsed = useUiStore((state) => state.toggleCollapsed)
  const setMobileOpen = useUiStore((state) => state.setMobileOpen)
  const collapsed = useUiStore((state) => state.collapsed)
  const { data: findings } = useFindings()
  const { data: scans } = useScans()
  const hasAlerts =
    findings?.some((finding) => finding.severity === 'critical' && finding.status === 'open') ||
    scans?.some((scan) => scan.status === 'failed')
  useEffect(() => {
    /** Focuses findings search when the analyst presses Ctrl or Command plus K. */
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [])
  const page = location.pathname.startsWith('/findings/')
    ? CONTENT.findingDetail.title
    : ({
        '/dashboard': CONTENT.dashboard.overviewTab,
        '/targets': CONTENT.targets.title,
        '/scans': CONTENT.scans.title,
        '/findings': CONTENT.findings.title,
        '/reports': CONTENT.reports.title,
      }[location.pathname] ?? CONTENT.dashboard.overviewTab)

  /** Sends the global search to the findings URL instead of claiming to search other entities. */
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(`/findings?search=${encodeURIComponent(search)}`)
    setSearch('')
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <IconHint label={collapsed ? CONTENT.navigation.expandSidebar : CONTENT.navigation.collapseSidebar} side="bottom">
          <button
            className="icon-button desktop-toggle"
            aria-label={CONTENT.navigation.toggleSidebar}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </button>
        </IconHint>
        <IconHint label={CONTENT.navigation.openNavigation} side="bottom">
          <button
            className="icon-button mobile-toggle"
            aria-label={CONTENT.navigation.openNavigation}
            onClick={() => {
              setMobileOpen(true)
            }}
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </IconHint>
        <div className="breadcrumb">
          <span>{CONTENT.navigation.workspaceLabel}</span>
          <ChevronRight size={12} />
          <strong>{page}</strong>
        </div>
      </div>
      <div className="header-right">
        <form className="header-search" onSubmit={handleSearch}>
          <Search size={13} />
          <label htmlFor="global-search" className="sr-only">
            {CONTENT.navigation.globalSearch}
          </label>
          <input
            ref={searchRef}
            id="global-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            placeholder={CONTENT.navigation.globalSearchPlaceholder}
          />
          <kbd>{CONTENT.navigation.searchShortcut}</kbd>
        </form>
        <span className="header-divider" />
        <IconHint label={CONTENT.navigation.notifications} side="bottom">
          <button
            className="icon-button"
            aria-label={CONTENT.navigation.notifications}
            onClick={() => {
              openModal('notifications')
            }}
          >
            <Bell size={17} aria-hidden="true" />
            {hasAlerts && <span className="notification-dot" aria-hidden="true" />}
          </button>
        </IconHint>
        <IconHint label={CONTENT.navigation.accountSettings} side="bottom">
          <button
            className="avatar header-avatar"
            aria-label={CONTENT.navigation.accountSettings}
            onClick={() => {
              openModal('settings')
            }}
          >
            AM
          </button>
        </IconHint>
      </div>
    </header>
  )
}
