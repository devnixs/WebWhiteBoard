import { firefox } from 'playwright'

const appUrl = 'http://127.0.0.1:9000'
const apiUrl = 'http://127.0.0.1:5058'
const firefoxExecutablePath = '/Applications/Firefox.app/Contents/MacOS/firefox'

async function createBoard() {
  const response = await fetch(`${apiUrl}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(`Board creation failed with status ${response.status}.`)
  }

  return response.json()
}

async function main() {
  const { boardId } = await createBoard()
  const browser = await firefox.launch({
    executablePath: firefoxExecutablePath,
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  try {
    await page.goto(appUrl, { waitUntil: 'networkidle' })
    await page.getByLabel('Your name').fill('Grid QA')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForURL(`${appUrl}/`)

    await page.goto(`${appUrl}/board/${boardId}`, { waitUntil: 'networkidle' })
    await page.getByLabel('Board tools').waitFor()
    await page.waitForSelector('.board-canvas-background', { state: 'visible' })
    await page.waitForSelector('.board-status-overlay', { state: 'hidden' })
    await page.screenshot({ path: 'artifacts/board-grid-empty.png' })

    await page.getByRole('button', { name: /Shapes/i }).click()
    await page.mouse.move(540, 320)
    await page.mouse.down()
    await page.mouse.move(760, 500, { steps: 12 })
    await page.mouse.up()

    await page.getByRole('button', { name: /Text/i }).click()
    await page.mouse.click(860, 360)
    await page.keyboard.type('Grid check')

    await page.screenshot({ path: 'artifacts/board-grid-content.png' })

    const backgroundMetrics = await page.evaluate(() => {
      const element = document.querySelector('.board-canvas-background')
      if (!(element instanceof HTMLElement)) {
        throw new Error('Grid background element not found.')
      }

      const styles = getComputedStyle(element)
      return {
        minorOpacity: styles.getPropertyValue('--board-grid-minor-opacity').trim(),
        majorOpacity: styles.getPropertyValue('--board-grid-major-opacity').trim(),
        sharePanelText: document.querySelector('.share-button__meta')?.textContent?.trim() ?? '',
      }
    })

    console.log(JSON.stringify({ boardId, backgroundMetrics }, null, 2))
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
