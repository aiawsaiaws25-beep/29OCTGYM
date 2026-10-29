// Visual + console sweep: every screen, three widths, both themes. Saves PNGs and prints console problems.
// Usage: node scripts/screen-check.mjs [baseURL] [outDir]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const base = process.argv[2] || 'http://localhost:5174'
const out = process.argv[3] || 'test-results/screens'
mkdirSync(out, { recursive: true })

const widths = { phone: 375, tablet: 768, desktop: 1440 }
const screens = ['/', '/dashboard', '/library', '/workout', '/progress', '/classes', '/profile']
const problems = []
const overflow = []

const browser = await chromium.launch()
for (const [label, width] of Object.entries(widths)) {
  const context = await browser.newContext({ viewport: { width, height: label === 'phone' ? 812 : 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${label} ${page.url()} [${m.type()}] ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`${label} ${page.url()} [pageerror] ${e.message}`))

  await page.goto(base + '/')
  await page.request.post(base + '/api/auth/login', { data: { email: 'test@pulsefit.local', password: 'pulsefit-test-2026' } })

  for (const theme of ['dark', 'light']) {
    await page.goto(base + '/')
    await page.evaluate((t) => localStorage.setItem('pulsefit-theme', t), theme)
    for (const s of screens) {
      await page.goto(base + s)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1800)
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      if (sw > cw) overflow.push(`${label} ${theme} ${s}: scrollWidth ${sw} > ${cw}`)
      const name = `${label}-${theme}-${s === '/' ? 'landing' : s.slice(1)}.png`
      await page.screenshot({ path: path.join(out, name), fullPage: label !== 'desktop' })
    }
  }
  await context.close()
}
await browser.close()

console.log(`Saved screenshots to ${out}`)
console.log('Console problems:', problems.length ? '\n' + problems.join('\n') : 'none')
console.log('Horizontal overflow:', overflow.length ? '\n' + overflow.join('\n') : 'none')
