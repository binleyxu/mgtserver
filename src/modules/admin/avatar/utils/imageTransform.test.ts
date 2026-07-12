import { describe, expect, it } from 'vitest'

import {
  AVATAR_CANVAS_SIZE,
  AVATAR_CROP_BOX_SIZE,
  createAvatarCanvasView,
  computeCropRect,
  resolveAvatarUrl,
  validateAvatarFile,
} from './imageTransform'

describe('admin avatar imageTransform', () => {
  it('resolveAvatarUrl should return empty string when url is missing', () => {
    expect(resolveAvatarUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg')
    expect(resolveAvatarUrl('')).toBe('')
    expect(resolveAvatarUrl(null)).toBe('')
    expect(resolveAvatarUrl(undefined)).toBe('')
  })

  it('validateAvatarFile should only allow bmp/jpg/png and size <= 5MB', () => {
    const okFile = { type: 'image/png', size: 1024 } as File
    const invalidType = { type: 'image/gif', size: 1024 } as File
    const tooLarge = { type: 'image/jpeg', size: 6 * 1024 * 1024 } as File

    expect(validateAvatarFile(okFile)).toBeNull()
    expect(validateAvatarFile(invalidType)).toBe('仅支持 bmp、jpg、png 格式')
    expect(validateAvatarFile(tooLarge)).toBe('头像大小不能超过 5MB')
  })

  it('computeCropRect should stay in image bounds', () => {
    const meta = { width: 400, height: 300 }
    const view = createAvatarCanvasView(meta, AVATAR_CANVAS_SIZE, AVATAR_CROP_BOX_SIZE, 1)

    const crop = computeCropRect(meta, view, 9999, -9999)

    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.size).toBeLessThanOrEqual(meta.width)
    expect(crop.y + crop.size).toBeLessThanOrEqual(meta.height)
  })
})
