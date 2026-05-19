import { test, expect } from '@playwright/test'

async function loginAs(page: import('@playwright/test').Page, name: string) {
  await page.goto('/')
  await expect(page).toHaveTitle('WebWhiteBoard')
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByRole('heading', { name: new RegExp(`welcome back, ${name}`, 'i') })).toBeVisible()
}

test.describe('homepage', () => {
  test('create board adds it to the known-boards list', async ({ page }) => {
    await loginAs(page, 'E2EUser')
    await page.getByRole('button', { name: /^create$/i }).click()
    // Should navigate to a board
    await expect(page).toHaveURL(/\/board\/[0-9a-f-]+/)
    await expect(page.locator('.board-screen')).toBeVisible()

    // Go back to homepage — board appears in list
    await page.goto('/')
    await expect(page.locator('.board-row')).toHaveCount(1)
  })

  test('board row re-opens the board', async ({ page }) => {
    await loginAs(page, 'E2EUser')
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForURL(/\/board\//)
    const boardUrl = page.url()

    await page.goto('/')
    await page.locator('.board-row').first().click()
    await expect(page).toHaveURL(boardUrl)
  })

  test('searching by GUID opens that board', async ({ page }) => {
    const apiBase = process.env.BASE_URL ?? 'http://localhost:5173'
    const res = await page.request.post(`${apiBase}/boards`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })
    const { boardId } = await res.json() as { boardId: string }

    await loginAs(page, 'E2EUser')
    await page.locator('input[aria-label="Search or open board by GUID"]').fill(boardId)
    await page.locator('.search-button').click()
    await expect(page).toHaveURL(`/board/${boardId}`)
  })

  test('only boards visited by current identity are shown', async ({ page }) => {
    // No boards visited yet — empty state shown
    await loginAs(page, 'E2ENewUser')
    await expect(page.getByText(/no boards are stored yet/i)).toBeVisible()
  })
})
