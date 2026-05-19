import { test, expect } from '@playwright/test'

const clipboardPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

async function loginAndCreateBoard(page: import('@playwright/test').Page, name = 'E2EUser') {
  await page.goto('/')
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByRole('button', { name: /^create$/i }).click()
  await expect(page.locator('.board-screen')).toBeVisible()
  // Wait for WebSocket session to be ready
  await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
}

async function pasteClipboardImage(page: import('@playwright/test').Page) {
  await page.locator('.board-screen__canvas').click({ position: { x: 320, y: 240 } })
  await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const file = new File([bytes], 'pasted-image.png', { type: 'image/png' })
    const clipboardData = new DataTransfer()
    clipboardData.items.add(file)
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(pasteEvent)
  }, clipboardPngBase64)
}

async function getImageAssetSources(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const editor = window.__wwbEditor
    if (!editor) {
      return []
    }

    return editor
      .getCurrentPageShapes()
      .filter((shape) => shape.type === 'image')
      .map((shape) => {
        const assetId = 'assetId' in shape.props ? shape.props.assetId : null
        const asset = assetId ? editor.getAsset(assetId) : null
        return asset?.props.src ?? null
      })
      .filter((src): src is string => typeof src === 'string')
  })
}

async function getDocumentAssetSources(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const editor = window.__wwbEditor
    if (!editor) {
      return []
    }

    const records = Object.values(editor.getSnapshot().document.store as Record<string, { typeName?: string; props?: { src?: string | null } }>)
    return records
      .filter((record) => record.typeName === 'asset')
      .map((record) => record.props?.src ?? null)
      .filter((src): src is string => typeof src === 'string')
  })
}

async function waitForSingleImageShape(page: import('@playwright/test').Page) {
  await expect.poll(async () => (await getImageAssetSources(page)).length).toBe(1)
  await page.waitForTimeout(300)
  await expect.poll(async () => (await getImageAssetSources(page)).length).toBe(1)
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

  test('pasted images upload once, render via asset URLs, sync to collaborators, and persist after reload', async ({
    browser,
    page,
  }) => {
    await loginAndCreateBoard(page, 'PasteAlice')
    const boardUrl = page.url()

    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/assets',
    )
    const assetResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.startsWith('/assets/'),
    )

    await pasteClipboardImage(page)

    const uploadResponse = await uploadResponsePromise
    expect(uploadResponse.ok()).toBeTruthy()
    const uploaded = (await uploadResponse.json()) as { url?: string; Url?: string }
    const uploadedUrl = uploaded.url ?? uploaded.Url
    expect(uploadedUrl).toBeTruthy()

    const assetResponse = await assetResponsePromise
    expect(assetResponse.ok()).toBeTruthy()
    expect(assetResponse.headers()['content-type']).toContain('image/png')

    await waitForSingleImageShape(page)

    const imageAssetSources = await getImageAssetSources(page)
    expect(imageAssetSources).toHaveLength(1)
    expect(imageAssetSources[0]).toBe(uploadedUrl)
    expect(imageAssetSources[0].startsWith('/assets/')).toBeTruthy()

    const documentAssetSources = await getDocumentAssetSources(page)
    expect(documentAssetSources).toContain(uploadedUrl)
    expect(documentAssetSources.some((src) => src.startsWith('data:'))).toBeFalsy()

    const collaboratorPage = await browser.newPage()
    await collaboratorPage.goto(boardUrl)
    await collaboratorPage.getByRole('textbox').fill('PasteBob')
    await collaboratorPage.getByRole('button', { name: /continue/i }).click()
    await expect(collaboratorPage.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await expect.poll(async () => (await getImageAssetSources(collaboratorPage)).length).toBe(1)
    await expect.poll(async () => (await getImageAssetSources(collaboratorPage))[0] ?? null).toBe(uploadedUrl)

    await page.waitForTimeout(800)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await expect.poll(async () => (await getImageAssetSources(page)).length).toBe(1)
    await expect.poll(async () => (await getImageAssetSources(page))[0] ?? null).toBe(uploadedUrl)

    await collaboratorPage.close()
  })

  test('legacy inline base64 image assets continue to render after reload', async ({ page }) => {
    await loginAndCreateBoard(page, 'LegacyAssetUser')

    await page.evaluate((base64) => {
      const editor = window.__wwbEditor
      if (!editor) {
        return
      }

      const assetId = 'asset:legacy-inline'
      editor.createAssets([
        {
          id: assetId,
          typeName: 'asset',
          type: 'image',
          meta: {},
          props: {
            name: 'legacy-inline.png',
            src: `data:image/png;base64,${base64}`,
            w: 1,
            h: 1,
            mimeType: 'image/png',
            isAnimated: false,
          },
        },
      ])
      editor.createShapes([
        {
          id: 'shape:legacy-inline',
          type: 'image',
          x: 200,
          y: 180,
          props: {
            assetId,
            w: 96,
            h: 96,
          },
        },
      ])
    }, clipboardPngBase64)

    await expect.poll(async () => (await getImageAssetSources(page)).length).toBe(1)
    await expect.poll(async () => (await getImageAssetSources(page))[0] ?? null).toContain('data:image/png;base64,')

    await page.waitForTimeout(800)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await expect.poll(async () => (await getImageAssetSources(page)).length).toBe(1)
    await expect.poll(async () => (await getImageAssetSources(page))[0] ?? null).toContain('data:image/png;base64,')
  })

  test('upload failures show a visible notice and do not leave a broken image on the canvas', async ({ page }) => {
    await page.route('**/assets', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 413,
          contentType: 'application/problem+json',
          body: JSON.stringify({ detail: 'Image exceeds max upload size.' }),
        })
        return
      }

      await route.continue()
    })

    await loginAndCreateBoard(page, 'PasteFailureUser')
    await pasteClipboardImage(page)

    await expect(page.locator('.board-upload-notice')).toBeVisible()
    await expect(page.locator('.board-upload-notice')).toContainText('Image exceeds max upload size.')
    await expect.poll(async () => (await getImageAssetSources(page)).length).toBe(0)
  })
})

// Expose __wwbEditor on the window type for TypeScript
declare global {
  interface Window {
    __wwbEditor?: import('tldraw').Editor
  }
}
