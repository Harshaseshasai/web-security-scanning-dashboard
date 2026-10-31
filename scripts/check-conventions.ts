import { readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'

const violations: string[] = []
const rules = [
  {
    dir: 'src/pages',
    match: /^[A-Z][a-zA-Z]+Page\.tsx$/,
    description: 'Pages must end in Page.tsx',
  },
  {
    dir: 'src/components/features',
    match: /^[A-Z][a-zA-Z]+\.tsx$/,
    description: 'Feature components must use PascalCase.tsx',
  },
  {
    dir: 'src/hooks',
    match: /^use-[a-z][a-z0-9-]+\.ts$/,
    description: 'Hooks must use use-kebab-case.ts',
  },
  {
    dir: 'src/schemas',
    match: /^[a-z][a-z0-9-]+\.schema\.ts$/,
    description: 'Schemas must use kebab-case.schema.ts',
  },
  {
    dir: 'src/store',
    match: /^[a-z][a-z0-9-]+\.store\.ts$/,
    description: 'Stores must use kebab-case.store.ts',
  },
  {
    dir: 'src/mocks/handlers',
    match: /^[a-z][a-z0-9-]+\.handlers\.ts$/,
    description: 'Handlers must use kebab-case.handlers.ts',
  },
]
/** Recursively checks source files against the rule for their directory. */
function walk(dir: string, callback: (file: string) => void) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, callback)
    else callback(full)
  }
}
for (const rule of rules) {
  walk(rule.dir, (file) => {
    const name = basename(file)
    // Section 5.3: permit the section 5.2 test suffix; it is not a production component.
    if (['index.ts', 'index.tsx'].includes(name) || /\.test\.tsx?$/.test(name)) return
    if (!rule.match.test(name)) violations.push(`${rule.description}: ${file}`)
  })
}
if (violations.length) {
  process.stderr.write(violations.join('\n') + '\n')
  process.exit(1)
}
process.stdout.write('All naming conventions pass.\n')
