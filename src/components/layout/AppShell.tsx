import { Outlet, useLocation } from 'react-router-dom'
import { useIsFetching } from '@tanstack/react-query'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { useUiStore } from '../../store/ui.store'
import { GlobalModals } from './GlobalModals'
import { CONTENT } from '../../config/content'

/** Provides navigation, page landmarks, refresh feedback, and shared workflow dialogs. */
export function AppShell() {
  const collapsed = useUiStore((state) => state.collapsed)
  const fetching = useIsFetching({
    /** Shows a nonblocking refresh indicator only for previously loaded non-scan data. */
    predicate: (query) => query.state.data !== undefined && query.queryKey[0] !== 'scans',
  })
  const location = useLocation()
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main">
        {CONTENT.navigation.skipToMain}
      </a>
      <AppSidebar />
      <div className="app-body">
        <AppHeader />
        {fetching > 0 && (
          <div className="refetch-indicator" role="status" aria-label={CONTENT.navigation.refreshing} />
        )}
        <main id="main" className="main-content" tabIndex={-1}>
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
          <footer className="app-footer">
            <span>{CONTENT.navigation.footer}</span>
            <span className="mono">
              {CONTENT.brand.version}<span aria-hidden="true"> / </span>
              {CONTENT.navigation.demoEnvironment}
            </span>
          </footer>
        </main>
      </div>
      <GlobalModals />
    </div>
  )
}
