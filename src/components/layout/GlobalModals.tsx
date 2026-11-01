import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, TriangleAlert, LogOut, Moon, ScanLine, Sun } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TargetForm } from '../features/targets/TargetForm'
import { ScanForm } from '../features/scans/ScanForm'
import { ReportForm } from '../features/reports/ReportForm'
import { useUiStore } from '../../store/ui.store'
import { useThemeStore } from '../../store/theme.store'
import { useAuthStore } from '../../store/auth.store'
import { useFindingStore } from '../../store/findings-filter.store'
import { useFindings, useScans, useTargets } from '../../hooks/use-data'
import { useWorkspace } from '../../hooks/use-auth'
import { CONTENT } from '../../config/content'
import { initials } from '../../lib/utils'

/** Hosts mutually exclusive target, scan, report, and workspace dialogs. */
export function GlobalModals() {
  const modal = useUiStore((state) => state.modal)
  const close = useUiStore((state) => state.closeModal)
  const targetId = useUiStore((state) => state.editTargetId)
  const preselected = useUiStore((state) => state.preselectedTarget)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggle)
  const session = useAuthStore((state) => state.session)
  const workspace = useWorkspace(session?.workspaceId ?? '')
  const signOut = useAuthStore((state) => state.signOut)
  const targets = useTargets()
  const findings = useFindings()
  const scans = useScans()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const workspaceName = workspace.data?.name ?? CONTENT.navigation.workspaceLoading
  const target = targets.data?.find((item) => item.id === targetId)
  const critical =
    findings.data?.filter(
      (finding) => finding.severity === 'critical' && finding.status === 'open'
    ) ?? []
  const failedCount = scans.data?.filter((scan) => scan.status === 'failed').length ?? 0

  /** Ends the demo session and clears cached or local triage data. */
  const handleSignOut = () => {
    close()
    signOut()
    useFindingStore.getState().reset()
    queryClient.clear()
    navigate('/login')
  }

  if (modal === null) return null
  const title =
    modal === 'target'
      ? targetId !== null
        ? CONTENT.targets.edit
        : CONTENT.targets.add
      : {
          scan: CONTENT.scans.new,
          report: CONTENT.reports.generate,
          help: CONTENT.help.title,
          notifications: CONTENT.notifications.title,
          settings: CONTENT.settings.title,
          workspace: workspaceName,
        }[modal]
  const description =
    modal === 'target'
      ? CONTENT.workspace.detailsBody
      : {
          scan: CONTENT.help.sections[1].body,
          report: CONTENT.help.sections[3].body,
          help: CONTENT.help.description,
          notifications: CONTENT.notifications.description,
          settings: CONTENT.settings.description,
          workspace: CONTENT.workspace.description,
        }[modal]
  return (
    <Modal open onClose={close} title={title} description={description}>
      {modal === 'target' && <TargetForm key={targetId ?? 'new'} target={target} onClose={close} />}
      {modal === 'scan' && <ScanForm targetId={preselected} onClose={close} />}
      {modal === 'report' && <ReportForm onClose={close} />}
      {modal === 'settings' && (
        <>
          <div className="settings-row">
            <div>
              <h3>{CONTENT.profile.appearance}</h3>
              <p>{CONTENT.profile.currentMode.replace('{theme}', theme)}</p>
            </div>
            <Button onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              {theme === 'light' ? CONTENT.profile.dark : CONTENT.profile.light}
            </Button>
          </div>
          <div className="settings-row">
            <div>
              <h3>{session?.user.name}</h3>
              <p>{session?.user.email}</p>
            </div>
            <span className="report-format">{session?.user.role}</span>
          </div>
          <div className="settings-key-field">
            <label htmlFor="settings-api-key">{CONTENT.profile.apiKey}</label>
            <input
              id="settings-api-key"
              type="password"
              placeholder={CONTENT.profile.apiKeyPlaceholder}
              autoComplete="off"
              aria-describedby="settings-api-key-help"
              disabled
            />
            <p id="settings-api-key-help">{CONTENT.profile.apiKeyHelp}</p>
          </div>
          <div className="settings-row">
            <div>
              <h3>{CONTENT.profile.history}</h3>
              <p>{CONTENT.profile.historyDescription}</p>
            </div>
          </div>
          <div className="modal-footer">
            <Button onClick={handleSignOut}>
              <LogOut size={13} />
              {CONTENT.navigation.signOut}
            </Button>
            <Button variant="primary" onClick={close}>
              {CONTENT.profile.close}
            </Button>
          </div>
        </>
      )}
      {modal === 'help' && (
        <>
          {CONTENT.help.sections.map((section) => (
            <section className="help-section" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
          <div className="modal-footer">
            <Button variant="primary" onClick={close}>
              {CONTENT.help.gotIt}
            </Button>
          </div>
        </>
      )}
      {modal === 'notifications' && (
        <>
          {critical.length ? (
            <Link
              to="/findings?severity=critical&status=open"
              onClick={close}
              className="activity-item"
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              <TriangleAlert size={18} className="text-danger" aria-hidden="true" />
              <div>
                <h3>
                  {critical.length} {CONTENT.notifications.criticalAttention}
                </h3>
                <p>{CONTENT.notifications.reviewCritical}</p>
              </div>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <p className="muted">{CONTENT.notifications.clear}</p>
          )}
          {failedCount > 0 && (
            <Link
              to="/scans?status=failed"
              onClick={close}
              className="activity-item"
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              <ScanLine size={20} />
              <div>
                <h3>
                  {failedCount}{' '}
                  {failedCount === 1
                    ? CONTENT.notifications.failedScan
                    : CONTENT.notifications.failedScans}
                </h3>
                <p>{CONTENT.notifications.failedHelp}</p>
              </div>
              <ArrowRight size={14} />
            </Link>
          )}
          <div className="modal-footer">
            <Button onClick={close}>{CONTENT.notifications.close}</Button>
          </div>
        </>
      )}
      {modal === 'workspace' && (
        <>
          <div className="settings-row">
            <div>
              <h3>{workspaceName}</h3>
              <p>{workspace.data?.plan ?? CONTENT.navigation.workspaceLoading}</p>
            </div>
            <span className="workspace-avatar">{initials(workspaceName)}</span>
          </div>
          <div className="help-section">
            <h3>{CONTENT.workspace.details}</h3>
            <p>{CONTENT.workspace.detailsBody}</p>
          </div>
          <div className="modal-footer">
            <Button
              onClick={() => {
                close()
                navigate('/targets')
              }}
            >
              {CONTENT.workspace.manageTargets}
              <ArrowRight size={13} />
            </Button>
            <Button variant="primary" onClick={close}>
              {CONTENT.workspace.continue}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
