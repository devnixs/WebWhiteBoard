import { test, expect } from '@playwright/test'

async function loginAndCreateBoard(page: import('@playwright/test').Page, name = 'E2EUser') {
  await page.goto('/')
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByRole('button', { name: /^create$/i }).click()
  await expect(page.locator('.board-screen')).toBeVisible()
  // Wait for WebSocket session to be ready
  await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
}

test.describe('board view', () => {
  test('board canvas and floating panels render', async ({ page }) => {
    await loginAndCreateBoard(page)
    await expect(page).toHaveTitle('WebWhiteBoard')
    await expect(page.locator('.panel--share')).toBeVisible()
    await expect(page.locator('.panel--tools')).toBeVisible()
    await expect(page.locator('.board-top-right')).toBeVisible()
    await expect(page.locator('.panel--bottom-right')).toBeVisible()
    await expect(page.locator('.board-canvas-background')).toBeVisible()
  })

  test('grid lines are visible on the canvas background', async ({ page }) => {
    await loginAndCreateBoard(page)
    const bg = page.locator('.board-canvas-background')
    await expect(bg).toBeVisible()
    // Confirm the background-image is set (contains linear-gradient grid lines)
    const bgImage = await bg.evaluate(el => getComputedStyle(el).backgroundImage)
    expect(bgImage).toContain('linear-gradient')
  })

  test('tool rail has all expected tools', async ({ page }) => {
    await loginAndCreateBoard(page)
    for (const label of ['Select', 'Pan', 'Pencil', 'Text', 'Shapes', 'Eraser', 'Lasso']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('pencil tool opens settings flyout', async ({ page }) => {
    await loginAndCreateBoard(page)
    await page.getByRole('button', { name: 'Pencil' }).click()
    await expect(page.locator('.panel--tool-settings')).toBeVisible()
  })

  test('eraser tool opens size settings', async ({ page }) => {
    await loginAndCreateBoard(page)
    await page.getByRole('button', { name: 'Eraser' }).click()
    await expect(page.locator('.panel--tool-settings')).toBeVisible()
  })

  test('shortcuts modal opens and closes', async ({ page }) => {
    await loginAndCreateBoard(page)
    await page.getByRole('button', { name: 'Open shortcuts' }).click()
    await expect(page.locator('.shortcut-modal')).toBeVisible()
    await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.shortcut-modal')).not.toBeVisible()
  })

  test('zoom buttons change the displayed zoom level', async ({ page }) => {
    await loginAndCreateBoard(page)
    const zoomLabel = page.locator('.zoom-level')
    await expect(zoomLabel).toHaveText('100%')
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect(zoomLabel).not.toHaveText('100%')
    await page.keyboard.press('Meta+0')
    await expect(zoomLabel).toHaveText('100%')
  })

  test('context menu appears when right-clicking a shape', async ({ page }) => {
    await loginAndCreateBoard(page)
    // Create a shape and get its screen center
    const screenPt = await page.evaluate(() => {
      const editor = window.__wwbEditor
      if (!editor) return null
      editor.createShapes([
        { type: 'geo', x: 300, y: 300, props: { w: 200, h: 150, geo: 'rectangle', color: 'blue', size: 'm', fill: 'none', dash: 'draw', labelColor: 'black' } },
      ])
      const shapes = editor.getCurrentPageShapes()
      if (!shapes.length) return null
      const bounds = editor.getShapePageBounds(shapes[0].id)!
      return editor.pageToScreen({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 })
    })
    if (!screenPt) throw new Error('Could not get shape screen position')
    await page.mouse.click(screenPt.x, screenPt.y, { button: 'right' })
    const menu = page.locator('.selection-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByText('Bring to front')).toBeVisible()
    await expect(menu.getByText('Duplicate')).toBeVisible()
    await expect(menu.getByText('Delete')).toBeVisible()
  })

  test('board state persists after reload', async ({ page }) => {
    await loginAndCreateBoard(page)
    await page.evaluate(() => {
      window.__wwbEditor?.createShapes([
        { type: 'geo', x: 100, y: 100, props: { w: 150, h: 100, geo: 'rectangle', color: 'red', size: 'm', fill: 'none', dash: 'draw', labelColor: 'black' } },
      ])
    })

    // Small wait for debounced WebSocket sync
    await page.waitForTimeout(500)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })

    const shapeCount = await page.evaluate(() => window.__wwbEditor?.getCurrentPageShapes().length ?? 0)
    expect(shapeCount).toBeGreaterThan(0)
  })

  test('latency indicator shows connection status', async ({ page }) => {
    await loginAndCreateBoard(page)
    // After session ready the latency pill shows ms value
    await expect(page.locator('.presence-chip--status')).toBeVisible()
  })
})

// Expose __wwbEditor on the window type for TypeScript
declare global {
  interface Window {
    __wwbEditor?: import('tldraw').Editor
  }
}
