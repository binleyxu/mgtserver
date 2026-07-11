import { useMemo, useState } from 'react'

import type { AvatarCropRect, AvatarImageMeta, AvatarPreview } from '../types/avatar.types'
import {
  AVATAR_CANVAS_SIZE,
  AVATAR_CROP_BOX_SIZE,
  AVATAR_MIN_IMAGE_SIDE,
  clampPan,
  computeCropRect,
  createAvatarCanvasView,
  drawPreviewDataUrl,
  readImageFromFile,
  validateAvatarFile,
} from '../utils/imageTransform'

type UseAvatarCropResult = {
  image: HTMLImageElement | null
  imageMeta: AvatarImageMeta | null
  zoom: number
  panX: number
  panY: number
  preview: AvatarPreview
  cropRect: AvatarCropRect | null
  boxSize: number
  cropBoxSize: number
  setZoom: (next: number) => void
  updatePan: (deltaX: number, deltaY: number) => void
  resizeCropBox: (delta: number) => void
  setFile: (file: File) => Promise<string | null>
  reset: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const MIN_CROP_BOX_SIZE = 120
const MAX_CROP_BOX_SIZE = 260

export function useAvatarCrop(): UseAvatarCropResult {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageMeta, setImageMeta] = useState<AvatarImageMeta | null>(null)
  const [zoom, setZoomState] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [cropBoxSize, setCropBoxSize] = useState(AVATAR_CROP_BOX_SIZE)

  const view = useMemo(() => {
    if (!imageMeta) return null
    return createAvatarCanvasView(imageMeta, AVATAR_CANVAS_SIZE, cropBoxSize, zoom)
  }, [cropBoxSize, imageMeta, zoom])

  const cropRect = useMemo(() => {
    if (!imageMeta || !view) return null
    return computeCropRect(imageMeta, view, panX, panY)
  }, [imageMeta, panX, panY, view])

  const preview = useMemo<AvatarPreview>(() => {
    if (!image || !cropRect) {
      return { smallDataUrl: null, largeDataUrl: null }
    }

    return {
      smallDataUrl: drawPreviewDataUrl(image, cropRect, 32),
      largeDataUrl: drawPreviewDataUrl(image, cropRect, 128),
    }
  }, [cropRect, image])

  const reset = () => {
    setImage(null)
    setImageMeta(null)
    setZoomState(1)
    setCropBoxSize(AVATAR_CROP_BOX_SIZE)
    setPanX(0)
    setPanY(0)
  }

  const setFile = async (file: File): Promise<string | null> => {
    const validationError = validateAvatarFile(file)
    if (validationError) {
      return validationError
    }

    const loaded = await readImageFromFile(file)
    if (loaded.naturalWidth < AVATAR_MIN_IMAGE_SIDE || loaded.naturalHeight < AVATAR_MIN_IMAGE_SIDE) {
      return `图片尺寸不能小于 ${AVATAR_MIN_IMAGE_SIDE}x${AVATAR_MIN_IMAGE_SIDE}`
    }

    setImage(loaded)
    setImageMeta({ width: loaded.naturalWidth, height: loaded.naturalHeight })
    setZoomState(1)
    setCropBoxSize(AVATAR_CROP_BOX_SIZE)
    setPanX(0)
    setPanY(0)

    return null
  }

  const setZoom = (next: number) => {
    if (!imageMeta) return

    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    const nextView = createAvatarCanvasView(imageMeta, AVATAR_CANVAS_SIZE, cropBoxSize, clampedZoom)

    setZoomState(clampedZoom)
    setPanX((prev) => clampPan(prev, nextView.minPanX, nextView.maxPanX))
    setPanY((prev) => clampPan(prev, nextView.minPanY, nextView.maxPanY))
  }

  const resizeCropBox = (delta: number) => {
    if (!imageMeta) return

    const nextCropBox = Math.round(
      Math.min(MAX_CROP_BOX_SIZE, Math.max(MIN_CROP_BOX_SIZE, cropBoxSize + delta))
    )
    if (nextCropBox === cropBoxSize) {
      return
    }

    const nextView = createAvatarCanvasView(imageMeta, AVATAR_CANVAS_SIZE, nextCropBox, zoom)
    setCropBoxSize(nextCropBox)
    setPanX((prev) => clampPan(prev, nextView.minPanX, nextView.maxPanX))
    setPanY((prev) => clampPan(prev, nextView.minPanY, nextView.maxPanY))
  }

  const updatePan = (deltaX: number, deltaY: number) => {
    if (!view) return

    setPanX((prev) => clampPan(prev + deltaX, view.minPanX, view.maxPanX))
    setPanY((prev) => clampPan(prev + deltaY, view.minPanY, view.maxPanY))
  }

  return {
    image,
    imageMeta,
    zoom,
    panX,
    panY,
    preview,
    cropRect,
    boxSize: AVATAR_CANVAS_SIZE,
    cropBoxSize,
    setZoom,
    updatePan,
    resizeCropBox,
    setFile,
    reset,
  }
}
