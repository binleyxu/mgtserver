// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAvatarCrop } from './useAvatarCrop'

const { drawPreviewDataUrlMock } = vi.hoisted(() => ({
  drawPreviewDataUrlMock: vi.fn(
    (_: HTMLImageElement, __: { x: number; y: number; size: number }, size: number) =>
      (size === 32 ? 'mock-small' : 'mock-large')
  ),
}))

vi.mock('../utils/imageTransform', async () => {
  const actual = await vi.importActual<typeof import('../utils/imageTransform')>('../utils/imageTransform')

  return {
    ...actual,
    drawPreviewDataUrl: drawPreviewDataUrlMock,
    readImageFromFile: vi.fn(async (file: File) => {
      if (file.name.includes('small')) {
        return {
          naturalWidth: 96,
          naturalHeight: 96,
        } as HTMLImageElement
      }

      return {
        naturalWidth: 360,
        naturalHeight: 240,
      } as HTMLImageElement
    }),
  }
})

describe('useAvatarCrop', () => {
  it('should reject unsupported file type before loading image', async () => {
    const { result } = renderHook(() => useAvatarCrop())
    const file = new File(['bad'], 'avatar.gif', { type: 'image/gif' })

    await act(async () => {
      const error = await result.current.setFile(file)
      expect(error).toBe('仅支持 bmp、jpg、png 格式')
    })

    expect(result.current.imageMeta).toBeNull()
  })

  it('should reject image smaller than minimum side', async () => {
    const { result } = renderHook(() => useAvatarCrop())
    const file = new File(['ok'], 'small-avatar.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const error = await result.current.setFile(file)
      expect(error).toBe('图片尺寸不能小于 128x128')
    })

    expect(result.current.imageMeta).toBeNull()
  })

  it('should clamp zoom and pan, and reset state', async () => {
    const { result } = renderHook(() => useAvatarCrop())
    const file = new File(['ok'], 'avatar.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const error = await result.current.setFile(file)
      expect(error).toBeNull()
    })

    expect(result.current.imageMeta).toEqual({ width: 360, height: 240 })
    expect(result.current.preview.smallDataUrl).toBe('mock-small')
    expect(result.current.preview.largeDataUrl).toBe('mock-large')

    act(() => {
      result.current.resizeCropBox(20)
    })
    expect(result.current.cropBoxSize).toBeGreaterThan(200)

    act(() => {
      result.current.updatePan(5000, -5000)
    })

    const pannedX = result.current.panX
    const pannedY = result.current.panY
    expect(Number.isFinite(pannedX)).toBe(true)
    expect(Number.isFinite(pannedY)).toBe(true)

    act(() => {
      result.current.setZoom(100)
    })
    expect(result.current.zoom).toBe(3)

    const zoomedPanX = result.current.panX
    const zoomedPanY = result.current.panY
    expect(Math.abs(zoomedPanX)).toBeLessThanOrEqual(Math.abs(pannedX))
    expect(Math.abs(zoomedPanY)).toBeLessThanOrEqual(Math.abs(pannedY))

    act(() => {
      result.current.setZoom(-100)
    })
    expect(result.current.zoom).toBe(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.image).toBeNull()
    expect(result.current.imageMeta).toBeNull()
    expect(result.current.zoom).toBe(1)
    expect(result.current.panX).toBe(0)
    expect(result.current.panY).toBe(0)
    expect(result.current.cropBoxSize).toBe(200)
    expect(result.current.preview.smallDataUrl).toBeNull()
    expect(result.current.preview.largeDataUrl).toBeNull()
  })
})
