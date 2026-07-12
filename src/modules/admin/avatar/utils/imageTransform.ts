import type { AvatarCanvasView, AvatarCropRect, AvatarImageMeta, AvatarSize } from '../types/avatar.types'

export const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/bmp', 'image/jpeg', 'image/png'])
export const AVATAR_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const AVATAR_MIN_IMAGE_SIDE = 128
export const AVATAR_CANVAS_SIZE = 280
export const AVATAR_CROP_BOX_SIZE = 200

export function resolveAvatarUrl(url?: string | null): string {
  return typeof url === 'string' ? url.trim() : ''
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
    return '仅支持 bmp、jpg、png 格式'
  }

  if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
    return '头像大小不能超过 5MB'
  }

  return null
}

export async function readImageFromFile(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('图片读取失败'))
    }
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = dataUrl
  })
}

export function createAvatarCanvasView(
  meta: AvatarImageMeta,
  canvasSize: number,
  cropBoxSize: number,
  zoom: number
): AvatarCanvasView {
  const baseScale = Math.max(canvasSize / meta.width, canvasSize / meta.height)
  const scale = baseScale * zoom
  const renderedWidth = meta.width * scale
  const renderedHeight = meta.height * scale

  const imageLeft = (canvasSize - renderedWidth) / 2
  const imageRight = imageLeft + renderedWidth
  const imageTop = (canvasSize - renderedHeight) / 2
  const imageBottom = imageTop + renderedHeight
  const cropHalf = cropBoxSize / 2

  const minPanX = imageLeft + cropHalf - canvasSize / 2
  const maxPanX = imageRight - cropHalf - canvasSize / 2
  const minPanY = imageTop + cropHalf - canvasSize / 2
  const maxPanY = imageBottom - cropHalf - canvasSize / 2

  const normalizedMinPanX = Math.min(minPanX, maxPanX)
  const normalizedMaxPanX = Math.max(minPanX, maxPanX)
  const normalizedMinPanY = Math.min(minPanY, maxPanY)
  const normalizedMaxPanY = Math.max(minPanY, maxPanY)

  return {
    canvasSize,
    cropBoxSize,
    renderedWidth,
    renderedHeight,
    minPanX: normalizedMinPanX,
    maxPanX: normalizedMaxPanX,
    minPanY: normalizedMinPanY,
    maxPanY: normalizedMaxPanY,
  }
}

export function clampPan(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

export function computeCropRect(
  meta: AvatarImageMeta,
  view: AvatarCanvasView,
  panX: number,
  panY: number
): AvatarCropRect {
  const imageX = (view.canvasSize - view.renderedWidth) / 2
  const imageY = (view.canvasSize - view.renderedHeight) / 2
  const cropLeft = view.canvasSize / 2 + panX - view.cropBoxSize / 2
  const cropTop = view.canvasSize / 2 + panY - view.cropBoxSize / 2
  const scale = view.renderedWidth / meta.width

  const rawX = (cropLeft - imageX) / scale
  const rawY = (cropTop - imageY) / scale
  const rawSize = view.cropBoxSize / scale

  const maxSize = Math.min(meta.width, meta.height)
  const size = Math.max(1, Math.min(rawSize, maxSize))

  const x = Math.max(0, Math.min(rawX, meta.width - size))
  const y = Math.max(0, Math.min(rawY, meta.height - size))

  return {
    x: Math.round(x),
    y: Math.round(y),
    size: Math.round(size),
  }
}

export function drawPreviewDataUrl(image: HTMLImageElement, crop: AvatarCropRect, size: AvatarSize): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    return ''
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, size, size)

  return canvas.toDataURL('image/jpeg', 0.9)
}
