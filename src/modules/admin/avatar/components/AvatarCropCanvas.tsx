import { useMemo, useRef, useState } from 'react'

import type { AvatarImageMeta } from '../types/avatar.types'
import { createAvatarCanvasView } from '../utils/imageTransform'

type AvatarCropCanvasProps = {
  image: HTMLImageElement
  imageMeta: AvatarImageMeta
  boxSize: number
  cropBoxSize: number
  zoom: number
  panX: number
  panY: number
  onPan: (deltaX: number, deltaY: number) => void
  onResize: (delta: number) => void
}

export function AvatarCropCanvas({ image, imageMeta, boxSize, cropBoxSize, zoom, panX, panY, onPan, onResize }: AvatarCropCanvasProps) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const resizeRef = useRef<{ x: number; y: number } | null>(null)

  const view = useMemo(() => createAvatarCanvasView(imageMeta, boxSize, cropBoxSize, zoom), [boxSize, cropBoxSize, imageMeta, zoom])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return

    const deltaX = event.clientX - dragRef.current.x
    const deltaY = event.clientY - dragRef.current.y
    dragRef.current = { x: event.clientX, y: event.clientY }
    onPan(deltaX, deltaY)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    setDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleResizePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    resizeRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleResizePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return

    const deltaX = event.clientX - resizeRef.current.x
    const deltaY = event.clientY - resizeRef.current.y
    resizeRef.current = { x: event.clientX, y: event.clientY }
    onResize((deltaX + deltaY) / 2)
  }

  const handleResizePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    resizeRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const overlayLeft = boxSize / 2 - cropBoxSize / 2 + panX
  const overlayTop = boxSize / 2 - cropBoxSize / 2 + panY

  return (
    <div
      style={{
        width: boxSize,
        height: boxSize,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid #d8e2e8',
        background: '#f5f7f9',
        cursor: 'default',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <img
        src={image.src}
        alt="裁剪预览"
        draggable={false}
        style={{
          width: view.renderedWidth,
          height: view.renderedHeight,
          position: 'absolute',
          left: (boxSize - view.renderedWidth) / 2,
          top: (boxSize - view.renderedHeight) / 2,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: overlayLeft,
          top: overlayTop,
          width: cropBoxSize,
          height: cropBoxSize,
          cursor: dragging ? 'grabbing' : 'grab',
          border: '2px solid rgba(47,127,134,0.85)',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        >
          <div
            style={{
              position: 'absolute',
              right: -14,
              bottom: -14,
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '2px solid #2f7f86',
              background: '#ffffff',
              boxShadow: '0 4px 10px rgba(16, 33, 45, 0.22)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'nwse-resize',
            }}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
          >
            <div
              style={{
                position: 'absolute',
                width: 11,
                height: 2,
                borderRadius: 2,
                background: '#2f7f86',
                transform: 'rotate(45deg) translate(2px, 2px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 8,
                height: 2,
                borderRadius: 2,
                background: '#2f7f86',
                transform: 'rotate(45deg) translate(-2px, -2px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -8,
              }}
            />
          </div>
        </div>
    </div>
  )
}

export default AvatarCropCanvas
