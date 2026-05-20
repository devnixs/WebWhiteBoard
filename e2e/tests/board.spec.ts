import { expect, test } from '@playwright/test'

const clipboardPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

async function loginAndCreateBoard(page: import('@playwright/test').Page, name = 'E2EUser') {
  await page.goto('/')
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByRole('button', { name: /^create$/i }).click()
  await expect(page.locator('.board-screen')).toBeVisible()
  await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
}

async function replaceDocument(
  page: import('@playwright/test').Page,
  document: Record<string, unknown>,
) {
  await page.evaluate((nextDocument) => {
    window.__wwbCanvasRuntime?.replaceDocument(nextDocument as never)
  }, document)
}

async function getRuntimeState(page: import('@playwright/test').Page) {
  return await page.evaluate(() => window.__wwbCanvasRuntime?.getState() ?? null)
}

async function getDocumentElements(page: import('@playwright/test').Page) {
  return await page.evaluate(() => window.__wwbCanvasRuntime?.getState().document.store.elements ?? [])
}

async function waitForElementCount(
  page: import('@playwright/test').Page,
  predicate: (elements: Array<Record<string, unknown>>) => boolean,
) {
  await expect.poll(async () => {
    const elements = (await getDocumentElements(page)) as Array<Record<string, unknown>>
    return predicate(elements)
  }).toBeTruthy()
}

async function pageToScreen(
  page: import('@playwright/test').Page,
  point: { x: number; y: number },
) {
  const screenPoint = await page.evaluate((pagePoint) => {
    const state = window.__wwbCanvasRuntime?.getState()
    if (!state) {
      return null
    }

    return {
      x: state.canvasSize.width / 2 + state.viewport.x + pagePoint.x * state.viewport.zoom,
      y: state.canvasSize.height / 2 + state.viewport.y + pagePoint.y * state.viewport.zoom,
    }
  }, point)

  if (!screenPoint) {
    throw new Error('Missing runtime state.')
  }

  return screenPoint
}

async function clickCanvasAtPage(
  page: import('@playwright/test').Page,
  point: { x: number; y: number },
  button: 'left' | 'right' = 'left',
) {
  const screenPoint = await pageToScreen(page, point)
  await page.locator('.board-screen__canvas').click({
    button,
    position: {
      x: screenPoint.x,
      y: screenPoint.y,
    },
  })
}

async function dragCanvasAtPage(
  page: import('@playwright/test').Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const start = await pageToScreen(page, from)
  const end = await pageToScreen(page, to)
  const canvas = page.locator('.board-screen__canvas')
  await canvas.hover({ position: { x: start.x, y: start.y } })
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 12 })
  await page.mouse.up()
}

async function panCanvasBy(
  page: import('@playwright/test').Page,
  delta: { x: number; y: number },
  button: 'middle' | 'right' = 'middle',
) {
  const state = await getRuntimeState(page)
  if (!state) {
    throw new Error('Missing runtime state.')
  }

  const canvas = page.locator('.board-screen__canvas')
  const start = {
    x: Math.round(state.canvasSize.width / 2),
    y: Math.round(state.canvasSize.height / 2),
  }

  await canvas.hover({ position: start })
  await page.mouse.down({ button })
  await page.mouse.move(start.x + delta.x, start.y + delta.y, { steps: 10 })
  await page.mouse.up({ button })
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

async function waitForSingleImageElement(page: import('@playwright/test').Page) {
  await expect.poll(async () => {
    const elements = await getDocumentElements(page)
    return elements.filter((element) => element.type === 'image').length
  }).toBe(1)
}

async function getCursorTransform(page: import('@playwright/test').Page, label: string) {
  return await page
    .locator('.remote-cursor')
    .filter({ has: page.locator('.remote-cursor__label', { hasText: label }) })
    .evaluate((element) => window.getComputedStyle(element).transform)
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

  test('tool rail has all expected tools and tool panels', async ({ page }) => {
    await loginAndCreateBoard(page)
    for (const label of ['Select', 'Pan', 'Pencil', 'Text', 'Shapes', 'Arrow', 'Eraser', 'Lasso']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }

    await page.getByRole('button', { name: 'Pencil' }).click()
    await expect(page.locator('.panel--tool-settings')).toContainText('Pencil')
    await page.getByRole('button', { name: 'Text' }).click()
    await expect(page.locator('.panel--tool-settings')).toContainText('Text')
    await page.getByRole('button', { name: 'Shapes' }).click()
    await expect(page.locator('.panel--tool-settings')).toContainText('Shapes')
    await page.getByRole('button', { name: 'Arrow' }).click()
    await expect(page.locator('.panel--tool-settings')).toContainText('Arrow')
  })

  test('arrow tool creates persisted arrows from the tool rail and keyboard shortcut', async ({ page }) => {
    await loginAndCreateBoard(page)

    await page.getByRole('button', { name: 'Arrow' }).click()
    await page.getByRole('button', { name: 'red' }).click()
    await page.getByRole('button', { name: '8 px' }).click()
    await dragCanvasAtPage(page, { x: -140, y: -30 }, { x: 80, y: 90 })

    await expect.poll(async () => {
      const elements = await getDocumentElements(page)
      return elements.filter((element) => element.type === 'shape' && element.shape === 'arrow').length
    }).toBe(1)

    await page.keyboard.press('V')
    await page.keyboard.press('A')
    const stateAfterShortcut = await getRuntimeState(page)
    expect(stateAfterShortcut?.activeTool).toBe('arrow')

    await dragCanvasAtPage(page, { x: 180, y: 120 }, { x: -40, y: 180 })

    await expect.poll(async () => {
      const elements = await getDocumentElements(page)
      return elements.filter((element) => element.type === 'shape' && element.shape === 'arrow').length
    }).toBe(2)

    const arrowsBeforeReload = (await getDocumentElements(page)).filter(
      (element) => element.type === 'shape' && element.shape === 'arrow',
    )
    expect(arrowsBeforeReload).toHaveLength(2)
    expect(arrowsBeforeReload.every((element) => element.color === 'red' && element.size === 'l')).toBeTruthy()

    await page.waitForTimeout(500)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })

    const arrowsAfterReload = (await getDocumentElements(page)).filter(
      (element) => element.type === 'shape' && element.shape === 'arrow',
    )
    expect(arrowsAfterReload).toHaveLength(2)
    expect(arrowsAfterReload.every((element) => element.color === 'red' && element.size === 'l')).toBeTruthy()
  })

  test('context menu appears when right-clicking a native shape', async ({ page }) => {
    await loginAndCreateBoard(page)
    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'shape-1',
            type: 'shape',
            color: 'blue',
            size: 'm',
            shape: 'rectangle',
            position: { x: 120, y: 140 },
            width: 180,
            height: 120,
            rotation: 0,
          },
        ],
      },
    })

    await clickCanvasAtPage(page, { x: 210, y: 200 }, 'right')
    const menu = page.locator('.selection-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByText('Bring to front')).toBeVisible()
    await expect(menu.getByText('Duplicate')).toBeVisible()
    await expect(menu.getByText('Delete')).toBeVisible()
  })

  test('context menu color palette applies the exact chosen swatch', async ({ page }) => {
    await loginAndCreateBoard(page)
    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'shape-color',
            type: 'shape',
            color: 'blue',
            size: 'm',
            shape: 'rectangle',
            position: { x: 140, y: 160 },
            width: 180,
            height: 120,
            rotation: 0,
          },
        ],
      },
    })

    await clickCanvasAtPage(page, { x: 230, y: 220 }, 'right')
    const menu = page.locator('.selection-menu')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('group', { name: 'Color palette' })).toBeVisible()
    await page.getByRole('button', { name: 'Choose Red' }).click()

    await expect.poll(async () => {
      const elements = await getDocumentElements(page)
      const shape = elements.find((element) => element.id === 'shape-color')
      return shape?.color ?? null
    }).toBe('red')
  })

  test('native selection editing actions duplicate and delete shapes', async ({ page }) => {
    await loginAndCreateBoard(page)
    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'shape-edit',
            type: 'shape',
            color: 'blue',
            size: 'm',
            shape: 'rectangle',
            position: { x: 150, y: 160 },
            width: 180,
            height: 120,
            rotation: 0,
          },
        ],
      },
    })

    await clickCanvasAtPage(page, { x: 240, y: 220 }, 'right')
    await page.getByRole('button', { name: 'Duplicate' }).click()
    await waitForElementCount(page, (elements) =>
      elements.filter((element) => element.type === 'shape').length === 2,
    )

    await clickCanvasAtPage(page, { x: 268, y: 248 }, 'right')
    await page.getByRole('button', { name: 'Delete' }).click()
    await waitForElementCount(page, (elements) =>
      elements.filter((element) => element.type === 'shape').length === 1,
    )
  })

  test('select tool marquee-selects shapes and right-drag pans without opening the context menu', async ({ page }) => {
    await loginAndCreateBoard(page)
    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'shape-marquee-a',
            type: 'shape',
            color: 'blue',
            size: 'm',
            shape: 'rectangle',
            position: { x: 120, y: 140 },
            width: 120,
            height: 120,
            rotation: 0,
          },
          {
            id: 'shape-marquee-b',
            type: 'shape',
            color: 'green',
            size: 'm',
            shape: 'rectangle',
            position: { x: 300, y: 160 },
            width: 120,
            height: 120,
            rotation: 0,
          },
        ],
      },
    })

    await page.getByRole('button', { name: 'Select' }).click()
    await dragCanvasAtPage(page, { x: 80, y: 100 }, { x: 460, y: 320 })

    await expect.poll(async () => {
      const state = await getRuntimeState(page)
      return state?.selectedIds.length ?? 0
    }).toBe(2)

    const beforePan = await getRuntimeState(page)
    await panCanvasBy(page, { x: 80, y: 50 }, 'right')

    await expect(page.locator('.selection-menu')).toHaveCount(0)
    await expect.poll(async () => {
      const state = await getRuntimeState(page)
      return state?.viewport ?? null
    }).not.toEqual(beforePan?.viewport ?? null)
  })

  test('native board state persists after reload', async ({ page }) => {
    await loginAndCreateBoard(page)
    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'persist-shape',
            type: 'shape',
            color: 'red',
            size: 'm',
            shape: 'rectangle',
            position: { x: 100, y: 100 },
            width: 150,
            height: 100,
            rotation: 0,
          },
        ],
      },
    })

    await page.waitForTimeout(500)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })

    const elements = await getDocumentElements(page)
    expect(elements.some((element) => element.id === 'persist-shape')).toBeTruthy()
  })

  test('pasted images upload once, sync by asset URL, and persist after reload', async ({ browser, page }) => {
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

    await waitForSingleImageElement(page)

    const imageElements = await getDocumentElements(page)
    const localImage = imageElements.find((element) => element.type === 'image')
    expect(localImage?.src).toBe(uploadedUrl)

    const collaboratorPage = await browser.newPage()
    await collaboratorPage.goto(boardUrl)
    await collaboratorPage.getByRole('textbox').fill('PasteBob')
    await collaboratorPage.getByRole('button', { name: /continue/i }).click()
    await expect(collaboratorPage.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await waitForSingleImageElement(collaboratorPage)
    const collaboratorImage = (await getDocumentElements(collaboratorPage)).find((element) => element.type === 'image')
    expect(collaboratorImage?.src).toBe(uploadedUrl)

    await page.waitForTimeout(700)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await waitForSingleImageElement(page)
    const reloadedImage = (await getDocumentElements(page)).find((element) => element.type === 'image')
    expect(reloadedImage?.src).toBe(uploadedUrl)

    await collaboratorPage.close()
  })

  test('native canvas collaboration, remote cursor anchoring, and persisted reload work without tldraw', async ({ browser, page }) => {
    await loginAndCreateBoard(page, 'CollabAlice')
    const boardUrl = page.url()

    const collaboratorPage = await browser.newPage()
    await collaboratorPage.goto(boardUrl)
    await collaboratorPage.getByRole('textbox').fill('CollabBob')
    await collaboratorPage.getByRole('button', { name: /continue/i }).click()
    await expect(collaboratorPage.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Pencil' }).click()
    await dragCanvasAtPage(page, { x: -120, y: -40 }, { x: 160, y: 90 })

    await waitForElementCount(collaboratorPage, (elements) =>
      elements.some((element) => element.type === 'stroke'),
    )

    await page.locator('.board-screen__canvas').hover({ position: { x: 420, y: 260 } })
    await expect(collaboratorPage.locator('.remote-cursor__label', { hasText: 'CollabAlice' })).toBeVisible()
    const transformBeforePan = await getCursorTransform(collaboratorPage, 'CollabAlice')

    await collaboratorPage.getByRole('button', { name: 'Pan' }).click()
    await panCanvasBy(collaboratorPage, { x: 110, y: 70 })
    const transformAfterPan = await getCursorTransform(collaboratorPage, 'CollabAlice')
    expect(transformAfterPan).not.toBe(transformBeforePan)

    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/assets',
    )
    await pasteClipboardImage(page)
    const uploadResponse = await uploadResponsePromise
    expect(uploadResponse.ok()).toBeTruthy()

    await waitForSingleImageElement(page)
    await waitForSingleImageElement(collaboratorPage)

    const aliceImage = (await getDocumentElements(page)).find((element) => element.type === 'image')
    const bobImage = (await getDocumentElements(collaboratorPage)).find((element) => element.type === 'image')
    expect(aliceImage?.src).toBeTruthy()
    expect(bobImage?.src).toBe(aliceImage?.src)
    expect(String(aliceImage?.src)).toContain('/assets/')

    await page.reload()
    await collaboratorPage.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await expect(collaboratorPage.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })

    await waitForElementCount(page, (elements) =>
      elements.some((element) => element.type === 'stroke') &&
      elements.some((element) => element.type === 'image' && String(element.src).includes('/assets/')),
    )
    await waitForElementCount(collaboratorPage, (elements) =>
      elements.some((element) => element.type === 'stroke') &&
      elements.some((element) => element.type === 'image' && String(element.src).includes('/assets/')),
    )

    expect(await page.evaluate(() => 'tldraw' in window)).toBeFalsy()
    expect(await page.evaluate(() => typeof window.__wwbEditor)).toBe('undefined')

    await collaboratorPage.close()
  })

  test('legacy base64 images still render and missing assets do not break board interaction', async ({ page }) => {
    await loginAndCreateBoard(page, 'LegacyAssets')
    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'legacy-image',
            type: 'image',
            position: { x: 80, y: 90 },
            width: 120,
            height: 120,
            rotation: 0,
            src: `data:image/png;base64,${clipboardPngBase64}`,
          },
          {
            id: 'missing-image',
            type: 'image',
            position: { x: 260, y: 110 },
            width: 120,
            height: 120,
            rotation: 0,
            src: '/assets/does-not-exist.png',
          },
          {
            id: 'shape-anchor',
            type: 'shape',
            color: 'orange',
            size: 'm',
            shape: 'rectangle',
            position: { x: 460, y: 120 },
            width: 160,
            height: 100,
            rotation: 0,
          },
        ],
      },
    })

    await waitForElementCount(page, (elements) =>
      elements.some((element) => element.id === 'legacy-image' && String(element.src).startsWith('data:image/png;base64,')) &&
      elements.some((element) => element.id === 'missing-image') &&
      elements.some((element) => element.id === 'shape-anchor'),
    )

    await page.waitForTimeout(400)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await waitForElementCount(page, (elements) =>
      elements.some((element) => element.id === 'legacy-image' && String(element.src).startsWith('data:image/png;base64,')) &&
      elements.some((element) => element.id === 'missing-image') &&
      elements.some((element) => element.id === 'shape-anchor'),
    )

    await clickCanvasAtPage(page, { x: 540, y: 170 }, 'right')
    const menu = page.locator('.selection-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByText('Bring to front')).toBeVisible()
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
    await expect.poll(async () => {
      const elements = await getDocumentElements(page)
      return elements.filter((element) => element.type === 'image').length
    }).toBe(0)
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

  test('ctrl plus mouse wheel zooms in 10 percent steps', async ({ page }) => {
    await loginAndCreateBoard(page)
    const canvas = page.locator('.board-screen__canvas')
    const zoomLabel = page.locator('.zoom-level')
    await expect(zoomLabel).toHaveText('100%')

    const state = await getRuntimeState(page)
    if (!state) {
      throw new Error('Missing runtime state.')
    }

    await canvas.hover({
      position: {
        x: Math.round(state.canvasSize.width / 2),
        y: Math.round(state.canvasSize.height / 2),
      },
    })

    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -100)
    await page.keyboard.up('Control')
    await expect(zoomLabel).toHaveText('110%')

    await page.keyboard.down('Control')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Control')
    await expect(zoomLabel).toHaveText('100%')
  })

  test('debug runtime hook is available for native canvas', async ({ page }) => {
    await loginAndCreateBoard(page)
    const state = await getRuntimeState(page)
    expect(state?.activeTool).toBe('select')
    expect(state?.document.schema.kind).toBe('wwb.native-board')
  })
})

declare global {
  interface Window {
    __wwbEditor?: unknown
    __wwbCanvasRuntime?: {
      getState: () => {
        activeTool: string
        canvasSize: { width: number; height: number }
        document: {
          schema: { kind: string; version: number }
          store: { elements: Array<Record<string, unknown>> }
        }
        selectedIds: string[]
        viewport: { x: number; y: number; zoom: number }
      }
      replaceDocument: (document: unknown) => void
    }
  }
}
