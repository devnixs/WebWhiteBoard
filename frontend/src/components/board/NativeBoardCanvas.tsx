import { useEffect, useRef } from 'react'
import { ensureBoardImages, renderBoardDocument } from '../../app/canvasRuntime'
import type { BoardRenderPreview } from '../../app/canvasRuntime'
import type { BoardCanvasSize, BoardDocumentSnapshot, BoardViewport } from '../../app/types'
import { BoardCanvasBackground } from './BoardCanvasBackground'

type NativeBoardCanvasProps = {
  canvasSize: BoardCanvasSize
  document: BoardDocumentSnapshot
  preview?: BoardRenderPreview
  viewport: BoardViewport
}

export function NativeBoardCanvas({ canvasSize, document, preview, viewport }: NativeBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const imageSources = document.store.elements
      .filter((element) => element.type === 'image')
      .map((element) => element.src)
    ensureBoardImages(imageSources, () => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      renderBoardDocument(canvas, document, viewport, canvasSize, preview)
    })
  }, [canvasSize, document, preview, viewport])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    renderBoardDocument(canvas, document, viewport, canvasSize, preview)
  }, [canvasSize, document, preview, viewport])

  return (
    <>
      <BoardCanvasBackground canvasSize={canvasSize} viewport={viewport} />
      <canvas
        aria-label="Board canvas"
        className="board-canvas-surface"
        ref={canvasRef}
      />
    </>
  )
}
