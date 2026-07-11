// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AvatarUploadModal } from './AvatarUploadModal'
import { useAvatarCrop } from '../hooks/useAvatarCrop'
import { uploadAdminAvatar } from '../services/avatarService'

const { messageApi } = vi.hoisted(() => ({
  messageApi: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('antd', () => ({
  Modal: ({
    open,
    title,
    children,
    onOk,
    onCancel,
    okText,
    cancelText,
  }: {
    open?: boolean
    title?: React.ReactNode
    children?: React.ReactNode
    onOk?: () => void
    onCancel?: () => void
    okText?: string
    cancelText?: string
  }) => {
    if (!open) return null
    return (
      <div>
        <h2>{title}</h2>
        <div>{children}</div>
        <button type="button" onClick={onOk}>{okText || 'ok'}</button>
        <button type="button" onClick={onCancel}>{cancelText || 'cancel'}</button>
      </div>
    )
  },
  Alert: ({ message, description }: { message?: React.ReactNode; description?: React.ReactNode }) => (
    <div>
      <div>{message}</div>
      <div>{description}</div>
    </div>
  ),
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
  Slider: ({ value, onChange }: { value?: number; onChange?: (value: number) => void }) => (
    <input
      type="range"
      min={1}
      max={3}
      step={0.01}
      value={value}
      onChange={(event) => onChange?.(Number(event.target.value))}
    />
  ),
  message: messageApi,
}))

vi.mock('../hooks/useAvatarCrop', () => ({
  useAvatarCrop: vi.fn(),
}))

vi.mock('../services/avatarService', () => ({
  uploadAdminAvatar: vi.fn(),
}))

const useAvatarCropMock = vi.mocked(useAvatarCrop)
const uploadAdminAvatarMock = vi.mocked(uploadAdminAvatar)

function mockCropState(overrides?: Partial<ReturnType<typeof useAvatarCrop>>) {
  const state: ReturnType<typeof useAvatarCrop> = {
    image: null,
    imageMeta: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    preview: { smallDataUrl: null, largeDataUrl: null },
    cropRect: null,
    boxSize: 280,
    cropBoxSize: 200,
    setZoom: vi.fn(),
    updatePan: vi.fn(),
    resizeCropBox: vi.fn(),
    setFile: vi.fn(async () => null),
    reset: vi.fn(),
    ...overrides,
  }
  useAvatarCropMock.mockReturnValue(state)
  return state
}

describe('AvatarUploadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should show base-info warning and block save when adminId is missing', async () => {
    mockCropState()

    render(
      <AvatarUploadModal
        open
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )

    expect(screen.getByText('请先保存管理员基础信息')).toBeTruthy()

    fireEvent.click(screen.getByText('保存头像'))

    await waitFor(() => {
      expect(messageApi.error).toHaveBeenCalledWith('请先保存管理员基础信息后再上传头像')
    })
  })

  it('should require file and crop before upload', async () => {
    mockCropState()

    render(
      <AvatarUploadModal
        open
        adminId="admin-1"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('保存头像'))

    await waitFor(() => {
      expect(messageApi.error).toHaveBeenCalledWith('请先选择图片并完成裁剪')
    })
    expect(uploadAdminAvatarMock).not.toHaveBeenCalled()
  })

  it('should upload successfully after file picked and call callbacks', async () => {
    const setFileMock = vi.fn(async () => null)
    mockCropState({
      imageMeta: { width: 360, height: 240 },
      cropRect: { x: 10, y: 20, size: 120 },
      setFile: setFileMock,
    })

    uploadAdminAvatarMock.mockResolvedValue({
      adminId: 'admin-1',
      avatarSmallUrl: '/static/avatar/a-32.jpg',
      avatarLargeUrl: '/static/avatar/a-128.jpg',
      avatarVersion: 2,
      avatarUpdatedAt: '2026-07-12 12:00:00',
    })

    const onClose = vi.fn()
    const onSaved = vi.fn()

    render(
      <AvatarUploadModal
        open
        adminId="admin-1"
        onClose={onClose}
        onSaved={onSaved}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['mock'], 'avatar.png', { type: 'image/png' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(setFileMock).toHaveBeenCalledWith(file)
    })
    await waitFor(() => {
      expect(screen.getByText('avatar.png')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('保存头像'))

    await waitFor(() => {
      expect(uploadAdminAvatarMock).toHaveBeenCalledWith({
        adminId: 'admin-1',
        file,
        crop: { x: 10, y: 20, size: 120 },
        imageMeta: { width: 360, height: 240 },
      })
    })

    expect(messageApi.success).toHaveBeenCalledWith('头像上传成功')
    expect(onSaved).toHaveBeenCalledWith({
      adminId: 'admin-1',
      avatarSmallUrl: '/static/avatar/a-32.jpg',
      avatarLargeUrl: '/static/avatar/a-128.jpg',
      avatarVersion: 2,
      avatarUpdatedAt: '2026-07-12 12:00:00',
    })
    expect(onClose).toHaveBeenCalled()
  })
})
