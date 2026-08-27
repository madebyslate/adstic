import { chromium } from '@playwright/test'
const dir = process.argv[2]
const b = await chromium.launch()
for (const [w, name] of [[1440,'desktop'],[768,'tablet'],[390,'mobile']]) {
  const p = await b.newPage({ viewport: { width: w, height: 1000 } })
  await p.goto('http://localhost:4399/', { waitUntil: 'networkidle' })
  const el = await p.locator('section:has(#ad-placements-heading)')
  await el.scrollIntoViewIfNeeded()
  await p.waitForTimeout(600)
  await el.screenshot({ path: `${dir}/p2-${name}.png` })
  await p.close()
}
await b.close()
