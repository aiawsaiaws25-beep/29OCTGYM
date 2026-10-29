import { test, expect } from '@playwright/test'

const PASSWORD = 'e2e-pass-123456'
const unique = (tag) => `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@pulsefit.test`

/** Collects console errors and page errors for the lifetime of a page. */
function watchConsole(page) {
  const problems = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`[console.${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`))
  return problems
}

async function expectNoHorizontalScroll(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth, 'page must not scroll horizontally').toBeLessThanOrEqual(clientWidth)
}

async function signup(page, name = 'Playwright Tester') {
  const email = unique('flow')
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Start training' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  return email
}

test.describe('Landing page (logged out)', () => {
  test('shows PulseFit branding, headline, tab title and animates counters', async ({ page }) => {
    const problems = watchConsole(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/PulseFit/)
    await expect(page.locator('header').getByText('PulseFit', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Train smarter.')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Get stronger.')
    await expect(page.locator('footer').getByText('PulseFit', { exact: true })).toBeVisible()

    // Counter animation: sample the "Classes this week" value while it counts up.
    const counter = page.getByText('Classes this week').locator('xpath=preceding-sibling::p[1]')
    const samples = new Set()
    for (let i = 0; i < 20; i++) {
      samples.add((await counter.innerText()).trim())
      await page.waitForTimeout(120)
    }
    await expect(counter).toHaveText('10')
    expect(samples.size, 'counter should pass through several values').toBeGreaterThan(1)

    await expectNoHorizontalScroll(page)
    expect(problems).toEqual([])
  })

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Your Workout' }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })

  test('keyboard: Tab reaches the main call to action and Enter activates it', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('button', { name: 'Start Your Workout' })
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      if (await cta.evaluate((el) => el === document.activeElement)) break
    }
    await expect(cta).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('protected pages redirect to login when logged out', async ({ page }) => {
    for (const path of ['/dashboard', '/library', '/workout', '/progress', '/profile']) {
      await page.goto(path)
      await expect(page, `${path} should redirect`).toHaveURL(/\/login$/)
    }
  })

  test('public pages have no console errors and no horizontal scroll', async ({ page }) => {
    const problems = watchConsole(page)
    for (const path of ['/', '/login', '/signup', '/classes']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectNoHorizontalScroll(page)
    }
    expect(problems).toEqual([])
  })

  test('login form rejects a wrong password with a friendly message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@pulsefit.test')
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText(/Wrong email or password/)).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Logged-in journey', () => {
  test('sign up, library filters, add exercises, live workout, dashboard updates, refresh, logout', async ({ page, isMobile }) => {
    const problems = watchConsole(page)

    const inPlan = []
    await test.step('sign up lands on the dashboard', async () => {
      await signup(page)
      await expect(page.getByRole('heading', { name: /Hey Playwright/ })).toBeVisible()
      await expect(page.getByText('Today’s workout')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible()
      // Remember which exercises the generated plan already contains.
      const chips = await page.locator('li', { hasText: '×' }).allInnerTexts()
      inPlan.push(...chips.map((t) => t.split(' · ')[0].trim()))
      expect(inPlan).toHaveLength(5)
      await expectNoHorizontalScroll(page)
    })

    await test.step('library: each muscle group filter shows only matching cards', async () => {
      await page.goto('/library')
      const cards = page.getByTestId('exercise-card')
      await expect(cards).toHaveCount(30)
      for (const group of ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']) {
        await page.getByRole('button', { name: group, exact: true }).click()
        await expect(cards).toHaveCount(5)
        const groups = await cards.evaluateAll((els) => els.map((el) => el.dataset.group))
        expect(groups.every((g) => g === group), `${group} filter`).toBe(true)
      }
      await page.getByRole('button', { name: 'All', exact: true }).click()
      await expect(cards).toHaveCount(30)
      await page.getByPlaceholder('Search exercises').fill('zzzz-nothing')
      await expect(page.getByText('No exercises found')).toBeVisible()
      await page.getByRole('button', { name: 'Clear filters' }).click()
      await expect(cards).toHaveCount(30)
      await expectNoHorizontalScroll(page)
    })

    const added = []
    await test.step('add 2 exercises to today’s workout', async () => {
      const cards = page.getByTestId('exercise-card')
      const count = await cards.count()
      for (let i = 0; i < count && added.length < 2; i++) {
        const card = cards.nth(i)
        const name = (await card.getByRole('heading').innerText()).trim()
        if (inPlan.includes(name)) continue
        await card.getByRole('button', { name: /Add .* to today/ }).click()
        const toast = page.getByText('Added to today').first()
        await expect(toast).toBeVisible()
        added.push(name)
        await page.getByRole('button', { name: 'Dismiss' }).first().click()
        await expect(toast).toBeHidden()
      }
      expect(added).toHaveLength(2)
    })

    await test.step('dashboard shows today’s workout including the added exercises, click Start', async () => {
      await page.goto('/dashboard')
      for (const name of added) await expect(page.getByText(name, { exact: false }).first()).toBeVisible()
      await page.getByRole('button', { name: 'Start', exact: true }).click()
      await expect(page).toHaveURL(/\/workout$/)
    })

    await test.step('live workout: rest timer counts down, tick every set, finish, confetti', async () => {
      await expect(page.getByText('Live workout')).toBeVisible()
      const sets = page.getByTestId('set-button')
      await expect(sets.first()).toBeVisible()
      const total = await sets.count()
      expect(total).toBeGreaterThan(5)

      const timer = page.getByTestId('rest-timer')
      await expect(timer).toHaveText('GO')
      await sets.first().click()
      await expect(sets.first()).toHaveAttribute('aria-pressed', 'true')
      await expect(timer).toHaveText(/^\d+:\d\d$/)
      const t1 = await timer.innerText()
      await page.waitForTimeout(2100)
      const t2 = await timer.innerText()
      const secs = (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])
      expect(secs(t2), 'rest timer should count down').toBeLessThan(secs(t1))

      // Tick every remaining set. The last click swaps the screen for the completion view.
      for (let i = 1; i < total - 1; i++) {
        await sets.nth(i).click()
        await expect(sets.nth(i)).toHaveAttribute('aria-pressed', 'true')
      }
      await sets.nth(total - 1).click()
      await expect(page.getByRole('heading', { name: 'Workout complete!' })).toBeVisible()
      await expect(page.getByText(`${total}`, { exact: true })).toBeVisible()
      await expect(page.locator('canvas'), 'confetti canvas should appear').toHaveCount(1)
      await expectNoHorizontalScroll(page)
    })

    await test.step('dashboard updates streak, chart and rings', async () => {
      await page.goto('/dashboard')
      await expect(page.getByText('Done for today. Nice work.')).toBeVisible()
      const streak = page.getByText('day streak', { exact: true }).locator('xpath=preceding-sibling::p[1]')
      await streak.scrollIntoViewIfNeeded()
      await expect(streak).toHaveText('1')
      await expect(page.getByText('Workouts', { exact: true }).locator('xpath=preceding-sibling::p[1]')).toContainText('1')
      await expect(page.getByText(/^\d+ active minutes this week$/)).not.toHaveText('0 active minutes this week')
      await expect(page.locator('.recharts-area-area')).toHaveCount(1)
    })

    await test.step('refresh keeps the data', async () => {
      await page.reload()
      await expect(page.getByText('Done for today. Nice work.')).toBeVisible()
      const streak = page.getByText('day streak', { exact: true }).locator('xpath=preceding-sibling::p[1]')
      await streak.scrollIntoViewIfNeeded()
      await expect(streak).toHaveText('1')
    })

    await test.step('profile and classes render with live data, no horizontal scroll', async () => {
      await page.goto('/profile')
      await expect(page.getByRole('heading', { name: 'Playwright Tester' })).toBeVisible()
      await expect(page.getByText('1 / 8 unlocked')).toBeVisible()
      await expectNoHorizontalScroll(page)
      await page.goto('/classes')
      await page.getByRole('button', { name: /Book spot|Class full/ }).first().click()
      await expect(page.getByText(/You’re booked|No spots left|Class full/).first()).toBeVisible()
      await expectNoHorizontalScroll(page)
      await page.goto('/progress')
      await expect(page.getByRole('heading', { name: 'Strength gains' })).toBeVisible()
      await expectNoHorizontalScroll(page)
    })

    await test.step('logout, then protected pages redirect to login', async () => {
      await page.goto('/profile')
      await page.locator('main').getByRole('button', { name: 'Log out' }).click()
      await expect(page).toHaveURL(/\/$/)
      for (const path of ['/dashboard', '/library', '/workout']) {
        await page.goto(path)
        await expect(page).toHaveURL(/\/login$/)
      }
    })

    expect(problems, `console problems (${isMobile ? 'mobile' : 'desktop'})`).toEqual([])
  })
})

test.describe('Accessibility basics', () => {
  test('every button has an accessible name and every image has alt text', async ({ page }) => {
    await signup(page, 'A11y Tester')
    for (const path of ['/dashboard', '/library', '/workout', '/classes', '/profile', '/']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const unnamed = await page.locator('button').evaluateAll((els) =>
        els
          .filter((b) => !(b.getAttribute('aria-label') || b.textContent || '').trim())
          .map((b) => b.outerHTML.slice(0, 80)),
      )
      expect(unnamed, `${path}: buttons without a name`).toEqual([])
      const noAlt = await page.locator('img').evaluateAll((els) => els.filter((i) => i.getAttribute('alt') === null).map((i) => i.src))
      expect(noAlt, `${path}: images without alt`).toEqual([])
    }
  })
})
