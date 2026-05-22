import { expect, test } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'

async function loginAndCreateBoard(page: Page, name: string) {
  await page.goto('/')
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByRole('button', { name: /^create$/i }).click()
  await expect(page.locator('.board-screen')).toBeVisible()
  await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
}

async function loginAndJoinBoard(page: Page, boardUrl: string, name: string) {
  await page.goto(boardUrl)
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.board-screen')).toBeVisible()
  await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
}

async function getDocumentElements(page: Page) {
  return await page.evaluate(() => window.__wwbCanvasRuntime?.getState().document.store.elements ?? [])
}

async function replaceDocument(page: Page, document: Record<string, unknown>) {
  await page.evaluate((next) => {
    window.__wwbCanvasRuntime?.replaceDocument(next as never)
  }, document)
}

async function pageToScreen(page: Page, point: { x: number; y: number }) {
  return await page.evaluate((pagePoint) => {
    const state = window.__wwbCanvasRuntime?.getState()
    if (!state) {
      return null
    }
    return {
      x: state.canvasSize.width / 2 + state.viewport.x + pagePoint.x * state.viewport.zoom,
      y: state.canvasSize.height / 2 + state.viewport.y + pagePoint.y * state.viewport.zoom,
    }
  }, point)
}

async function dragCanvasAtPage(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const start = await pageToScreen(page, from)
  const end = await pageToScreen(page, to)
  if (!start || !end) {
    throw new Error('Missing runtime state.')
  }
  const canvas = page.locator('.board-screen__canvas')
  await canvas.hover({ position: start })
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 12 })
  await page.mouse.up()
}

test.describe('concurrent action-based collaboration', () => {
  test('single participant edits survive reload via session-ready bulk path', async ({ page }) => {
    await loginAndCreateBoard(page, 'SoloUser')

    await page.getByRole('button', { name: 'Pencil' }).click()
    await dragCanvasAtPage(page, { x: -120, y: -40 }, { x: 80, y: 90 })

    await expect.poll(async () => (await getDocumentElements(page)).filter((element) => element.type === 'stroke').length).toBe(1)

    await page.waitForTimeout(500)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })

    await expect.poll(async () => (await getDocumentElements(page)).filter((element) => element.type === 'stroke').length).toBe(1)
  })

  test('concurrent strokes from two participants both survive in both contexts and after reload', async ({ browser, page }) => {
    await loginAndCreateBoard(page, 'AliceConcurrent')
    const boardUrl = page.url()

    const bobContext: BrowserContext = await browser.newContext()
    const bobPage = await bobContext.newPage()
    await loginAndJoinBoard(bobPage, boardUrl, 'BobConcurrent')

    await page.getByRole('button', { name: 'Pencil' }).click()
    await bobPage.getByRole('button', { name: 'Pencil' }).click()

    await Promise.all([
      dragCanvasAtPage(page, { x: -200, y: -120 }, { x: -80, y: -20 }),
      dragCanvasAtPage(bobPage, { x: 120, y: 60 }, { x: 240, y: 160 }),
    ])

    const expectTwoStrokes = async (target: Page) => {
      await expect.poll(async () =>
        (await getDocumentElements(target)).filter((element) => element.type === 'stroke').length,
      ).toBe(2)
    }

    await expectTwoStrokes(page)
    await expectTwoStrokes(bobPage)

    await page.waitForTimeout(700)
    await page.reload()
    await expect(page.locator('.board-status-overlay')).not.toBeVisible({ timeout: 10000 })
    await expectTwoStrokes(page)

    await bobContext.close()
  })

  test('undo and redo only apply to the current participant actions', async ({ browser, page }) => {
    await loginAndCreateBoard(page, 'AliceUndo')
    const boardUrl = page.url()

    await page.getByRole('button', { name: 'Pencil' }).click()
    await dragCanvasAtPage(page, { x: -220, y: -140 }, { x: -80, y: -40 })
    await expect.poll(async () =>
      (await getDocumentElements(page)).filter((element) => element.type === 'stroke').length,
    ).toBe(1)

    const aliceStrokeId = ((await getDocumentElements(page)).find((element) => element.type === 'stroke') as { id: string }).id

    const bobContext: BrowserContext = await browser.newContext()
    const bobPage = await bobContext.newPage()
    await loginAndJoinBoard(bobPage, boardUrl, 'BobUndo')

    await bobPage.getByRole('button', { name: 'Pencil' }).click()
    await dragCanvasAtPage(bobPage, { x: 100, y: 60 }, { x: 240, y: 170 })

    await expect.poll(async () =>
      (await getDocumentElements(page)).filter((element) => element.type === 'stroke').length,
    ).toBe(2)

    const bobStrokeId = ((await getDocumentElements(page)).find(
      (element) => element.type === 'stroke' && element.id !== aliceStrokeId,
    ) as { id: string }).id

    await page.keyboard.press('Control+Z')

    const expectOnlyBobStroke = async (target: Page) => {
      await expect.poll(async () => {
        const elements = await getDocumentElements(target)
        return {
          hasAliceStroke: elements.some((element) => element.id === aliceStrokeId),
          hasBobStroke: elements.some((element) => element.id === bobStrokeId),
          strokeCount: elements.filter((element) => element.type === 'stroke').length,
        }
      }).toEqual({ hasAliceStroke: false, hasBobStroke: true, strokeCount: 1 })
    }

    await expectOnlyBobStroke(page)
    await expectOnlyBobStroke(bobPage)

    await page.keyboard.press('Control+Y')

    const expectBothStrokes = async (target: Page) => {
      await expect.poll(async () => {
        const elements = await getDocumentElements(target)
        return {
          hasAliceStroke: elements.some((element) => element.id === aliceStrokeId),
          hasBobStroke: elements.some((element) => element.id === bobStrokeId),
          strokeCount: elements.filter((element) => element.type === 'stroke').length,
        }
      }).toEqual({ hasAliceStroke: true, hasBobStroke: true, strokeCount: 2 })
    }

    await expectBothStrokes(page)
    await expectBothStrokes(bobPage)

    await bobContext.close()
  })

  test('concurrent delete-and-add does not resurrect deleted element nor drop the new one', async ({ browser, page }) => {
    await loginAndCreateBoard(page, 'AliceDelete')
    const boardUrl = page.url()

    await replaceDocument(page, {
      schema: { kind: 'wwb.native-board', version: 1 },
      store: {
        elements: [
          {
            id: 'alice-original',
            type: 'shape',
            color: 'blue',
            size: 'm',
            shape: 'rectangle',
            position: { x: -200, y: -120 },
            width: 120,
            height: 80,
            rotation: 0,
          },
        ],
      },
    })

    const bobContext: BrowserContext = await browser.newContext()
    const bobPage = await bobContext.newPage()
    await loginAndJoinBoard(bobPage, boardUrl, 'BobDelete')

    await expect.poll(async () =>
      (await getDocumentElements(bobPage)).some((element) => element.id === 'alice-original'),
    ).toBeTruthy()

    await bobPage.getByRole('button', { name: 'Pencil' }).click()

    await Promise.all([
      page.evaluate(() => {
        const runtime = window.__wwbCanvasRuntime
        if (!runtime) {
          return
        }
        const state = runtime.getState()
        const next = {
          ...state.document,
          store: {
            elements: state.document.store.elements.filter((element) => element.id !== 'alice-original'),
          },
        }
        runtime.replaceDocument(next as never)
      }),
      dragCanvasAtPage(bobPage, { x: 100, y: 80 }, { x: 220, y: 180 }),
    ])

    const expectFinalState = async (target: Page) => {
      await expect.poll(async () => {
        const elements = await getDocumentElements(target)
        const hasOriginal = elements.some((element) => element.id === 'alice-original')
        const strokeCount = elements.filter((element) => element.type === 'stroke').length
        return { hasOriginal, strokeCount }
      }).toEqual({ hasOriginal: false, strokeCount: 1 })
    }

    await expectFinalState(page)
    await expectFinalState(bobPage)

    await bobContext.close()
  })
})

declare global {
  interface Window {
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
