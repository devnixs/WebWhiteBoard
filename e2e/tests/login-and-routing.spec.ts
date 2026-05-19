import { test, expect } from '@playwright/test'

// Each test gets a fresh isolated storage context so sessions don't bleed.

test.describe('login and routing', () => {
  test('first-time visit shows login screen', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('WebWhiteBoard')
    await expect(page.getByRole('heading', { name: /what should we call you/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  })

  test('login stores identity and navigates to homepage', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('textbox').fill('E2EUser')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByRole('heading', { name: /welcome back, E2EUser/i })).toBeVisible()
  })

  test('returning user sees homepage without login prompt', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('textbox').fill('E2EUser')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    // Reload — should skip login and go straight to homepage
    await page.reload()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('logout clears identity and returns to login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('textbox').fill('E2EUser')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    // Click the logout icon button (aria label not present — find via identity pill area)
    await page.locator('.logout-icon-button').click()
    await expect(page.getByRole('heading', { name: /what should we call you/i })).toBeVisible()
  })

  test('direct board link shows login-first flow with board hint', async ({ page }) => {
    // Create a board first using the API so we have a real GUID
    const apiBase = process.env.BASE_URL ?? 'http://localhost:5173'
    const res = await page.request.post(`${apiBase}/boards`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })
    expect(res.ok()).toBeTruthy()
    const { boardId } = await res.json() as { boardId: string }

    await page.goto(`/board/${boardId}`)
    await expect(page).toHaveTitle('WebWhiteBoard')
    await expect(page.getByRole('heading', { name: /what should we call you/i })).toBeVisible()
    await expect(page.getByText(/you will join board/i)).toBeVisible()

    // Complete login — should land directly on the board
    await page.getByRole('textbox').fill('E2EUser')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page).toHaveURL(new RegExp(`/board/${boardId}`))
    await expect(page).toHaveTitle('WebWhiteBoard')
    await expect(page.locator('.board-screen')).toBeVisible()
  })

  test('unknown route redirects gracefully', async ({ page }) => {
    await page.goto('/unknown-path/here')
    await expect(page.getByText(/only the homepage and board routes are valid/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /return home/i })).toBeVisible()
  })
})
