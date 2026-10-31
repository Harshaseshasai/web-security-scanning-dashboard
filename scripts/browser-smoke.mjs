import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { format } from 'prettier'

const origin = process.env.SMOKE_URL ?? 'http://localhost:5173'
await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
/** Navigates to a route and waits for its first meaningful heading. */
const goto = async (path) => {
  await page.goto(`${origin}${path}`)
  await page.locator('h1').waitFor()
  if (path === '/dashboard') {
    await page.getByRole('heading', { name: 'Findings by severity' }).waitFor()
  } else if (path.startsWith('/findings/')) {
    await page.getByRole('heading', { name: 'Evidence' }).waitFor()
  } else if (['/findings', '/targets', '/scans', '/reports'].includes(path)) {
    await page.locator('.data-table tbody tr').first().waitFor()
  }
  await page.waitForTimeout(1000)
}

try {
  await page.goto(`${origin}/findings`)
  await page.getByRole('heading', { name: 'Sign in to Sentinel' }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/login')
  await page.getByRole('button', { name: 'Enter demo workspace' }).click()
  await page.getByRole('heading', { name: 'Security overview' }).waitFor()
  await goto('/dashboard')
  const prioritySize = await page
    .locator('.risk-number')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  const secondarySize = await page
    .locator('.support-primary .support-number')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert(prioritySize > secondarySize, 'Critical risk must outrank secondary KPIs')
  await expect(page.getByRole('region', { name: 'Assessment priorities' })).toContainText(
    'Scans run'
  )
  await page.screenshot({ path: 'docs/screenshots/dashboard.png', fullPage: true })
  await page.getByRole('button', { name: 'Toggle sidebar' }).click()
  const compactFinding = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Findings', exact: true })
  await compactFinding.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Findings')
  await page.keyboard.press('Escape')
  await page.mouse.move(900, 160)
  const compactTarget = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Targets', exact: true })
  await compactTarget.focus()
  await expect(page.getByRole('tooltip')).toHaveText('Targets')
  await page.getByRole('button', { name: 'Toggle sidebar' }).click()
  const audits = []
  for (const route of [
    '/dashboard',
    '/findings',
    '/targets',
    '/scans',
    '/findings/FND-1048',
    '/reports',
  ]) {
    await goto(route)
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    audits.push({
      route,
      violations: audit.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        description: item.description,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    })
  }
  await writeFile(
    'docs/accessibility-audit.json',
    await format(JSON.stringify(audits), { parser: 'json', printWidth: 100 })
  )

  await goto('/findings')
  await expect(page.getByRole('columnheader', { name: 'CWE' })).toBeVisible()
  assert.equal(
    await page
      .locator('.severity-badge')
      .first()
      .evaluate((element) => getComputedStyle(element).borderRadius),
    '0px',
    'Severity labels must not be rounded pills'
  )
  assert.equal(
    await page.locator('.status-badge svg').count(),
    0,
    'Status indicators must not use circular icons'
  )
  await page.getByLabel('Search findings by title, description, location or CWE').fill('sql')
  await page.waitForTimeout(400)
  assert.equal(await page.locator('.findings-table tbody tr').count(), 4)
  await page.goBack()
  await page.waitForTimeout(400)
  assert.equal(await page.locator('.findings-table tbody tr').count(), 20)
  await page.goForward()
  await page.waitForTimeout(400)
  assert.equal(await page.locator('.findings-table tbody tr').count(), 4)
  await page.locator('.findings-table tbody tr').first().click()
  await page.getByRole('heading', { name: 'SQL injection in search endpoint' }).waitFor()
  await page.getByLabel('Change finding status').selectOption('confirmed')
  assert.match(await page.locator('.triage-current').innerText(), /Confirmed/)
  await page.screenshot({ path: 'docs/screenshots/finding-detail.png', fullPage: true })

  await page.getByRole('link', { name: 'Targets', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Customer application' }).hover()
  await expect(page.getByRole('tooltip')).toHaveText('Edit Customer application')
  const addTarget = page.getByRole('button', { name: 'Add target', exact: true })
  await addTarget.click()
  await page.keyboard.press('Shift+Tab')
  assert.equal(
    await page.getByRole('dialog').evaluate((element) => element.contains(document.activeElement)),
    true
  )
  await page.keyboard.press('Escape')
  await expect(addTarget).toBeFocused()
  await addTarget.click()
  await page.getByLabel('Target name').fill('Browser test target')
  await page.getByLabel('Target URL').fill('https://browser-test.example.com')
  await page.getByRole('button', { name: 'Add target', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  const newRow = page.locator('tr').filter({ hasText: 'Browser test target' })
  await newRow.waitFor()
  await newRow.getByRole('button', { name: 'Scan', exact: true }).click()
  await page.getByLabel('I am authorized to test this target.').check()
  await page.getByRole('button', { name: 'Start scan', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page.locator('h1').filter({ hasText: 'Scans' }).waitFor()

  await page.getByRole('link', { name: 'Reports', exact: true }).click()
  await page.getByRole('button', { name: 'Generate report', exact: true }).click()
  await page.getByRole('button', { name: 'Generate report', exact: true }).click()
  await page.getByRole('button', { name: 'Retry generation' }).waitFor()
  await page.waitForTimeout(510)
  await page.getByRole('button', { name: 'Retry generation' }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page
    .getByRole('button', { name: /^Download PDF for/ })
    .first()
    .click()
  await expect(page.getByText(/PDF export is a demo placeholder/)).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: /^Download .*Security assessment/ })
    .first()
    .click()
  const download = await downloadPromise
  assert.match(download.suggestedFilename(), /\.html$/)

  await page.getByRole('button', { name: 'Account settings' }).click()
  await expect(page.getByLabel('API key')).toBeDisabled()
  await page.getByRole('button', { name: 'Dark mode' }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.screenshot({ path: 'docs/screenshots/dark-reports.png', fullPage: true })
  assert.equal(await page.locator('html').getAttribute('class'), 'dark')
  await page.getByRole('button', { name: 'Account settings' }).click()
  await page.getByRole('button', { name: 'Light mode' }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.getByRole('heading', { name: 'Sign in to Sentinel' }).waitFor()
  const loginAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  audits.push({
    route: '/login',
    violations: loginAudit.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  })
  await writeFile(
    'docs/accessibility-audit.json',
    await format(JSON.stringify(audits), { parser: 'json', printWidth: 100 })
  )
  await page.getByLabel('Email address').fill('wrong@example.com')
  await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('alert').waitFor()
  await page.getByRole('button', { name: 'Enter demo workspace' }).click()
  await page.getByRole('heading', { name: 'Security overview' }).waitFor()

  await page.setViewportSize({ width: 800, height: 900 })
  await goto('/dashboard')
  await expect(page.locator('.recharts-line-curve')).toHaveCount(2)
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Targets', exact: true })
    .hover()
  await expect(page.getByRole('tooltip')).toHaveText('Targets')

  await page.setViewportSize({ width: 390, height: 844 })
  await goto('/dashboard')
  await expect(page.locator('.recharts-line-curve')).toHaveCount(2)
  await page.screenshot({ path: 'docs/screenshots/mobile.png', fullPage: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.equal(await page.evaluate(() => document.body.scrollWidth > innerWidth), false)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('link', { name: 'Targets', exact: true }).click()
  await page.getByRole('heading', { name: 'Targets', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)

  assert.deepEqual(errors, [])
  assert.equal(
    audits.reduce((sum, audit) => sum + audit.violations.length, 0),
    0,
    'Accessibility audit found violations'
  )
  process.stdout.write(
    `Browser workflows passed. ${audits.reduce((sum, audit) => sum + audit.violations.length, 0)} accessibility rule violations recorded.\n`
  )
} finally {
  await browser.close()
}
