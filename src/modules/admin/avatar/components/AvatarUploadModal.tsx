import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Modal, Slider, message } from 'antd'

import { uploadAdminAvatar } from '../services/avatarService'
import { useAvatarCrop } from '../hooks/useAvatarCrop'
import AvatarCropCanvas from './AvatarCropCanvas'
import AvatarPreview from './AvatarPreview'

type AvatarUploadModalProps = {
  open: boolean
  adminId?: string
  currentAvatarSmallUrl?: string | null
  onClose: () => void
  onSaved: (payload: {
    adminId: string
    avatarSmallUrl: string
    avatarLargeUrl: string
    avatarVersion?: number
    avatarUpdatedAt?: string
  }) => void
}

export function AvatarUploadModal({
  open,
  adminId,
  currentAvatarSmallUrl,
  onClose,
  onSaved,
}: AvatarUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [fileName, setFileName] = useState('')
  const [endpointUnavailable, setEndpointUnavailable] = useState(false)

  const { image, imageMeta, boxSize, cropBoxSize, zoom, panX, panY, preview, cropRect, setFile, setZoom, updatePan, resizeCropBox, reset } = useAvatarCrop()

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setFileName('')
      setEndpointUnavailable(false)
      reset()
    }
  }, [open, reset])

  const handlePickFile = async (file?: File) => {
    if (!file) return

    const error = await setFile(file)
    if (error) {
      message.error(error)
      return
    }

    setSelectedFile(file)
    setFileName(file.name)
  }

  const handleSave = async () => {
    if (!adminId) {
      message.error('请先保存管理员基础信息后再上传头像')
      return
    }

    if (!selectedFile || !cropRect || !imageMeta) {
      message.error('请先选择图片并完成裁剪')
      return
    }

    try {
      setSaving(true)
      const result = await uploadAdminAvatar({
        adminId,
        file: selectedFile,
        crop: cropRect,
        imageMeta,
      })
      message.success('头像上传成功')
      onSaved(result)
      onClose()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '头像上传失败'
      if (messageText.trim().toLowerCase() === 'not found' || messageText.includes('接口未就绪（404）')) {
        setEndpointUnavailable(true)
        message.error('头像上传接口未就绪（404）：请确认后端已实现 POST /admin/{id}/avatar')
      } else {
        message.error(messageText)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="编辑头像"
      onCancel={onClose}
      onOk={handleSave}
      okText="保存头像"
      cancelText="取消"
      confirmLoading={saving}
      okButtonProps={{ disabled: endpointUnavailable || !adminId }}
      width={760}
      destroyOnClose
    >
      {!adminId ? (
        <Alert
          type="warning"
          showIcon
          message="请先保存管理员基础信息"
          description="新增管理员需要先保存后才能上传头像。"
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {endpointUnavailable ? (
        <Alert
          type="error"
          showIcon
          message="头像上传接口未就绪（404）"
          description="当前后端未提供 POST /admin/{id}/avatar，已暂时禁用“保存头像”按钮。"
          style={{ marginBottom: 12 }}
        />
      ) : null}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div>
          {image && imageMeta ? (
            <AvatarCropCanvas
              image={image}
              imageMeta={imageMeta}
              boxSize={boxSize}
              cropBoxSize={cropBoxSize}
              zoom={zoom}
              panX={panX}
              panY={panY}
              onPan={updatePan}
              onResize={resizeCropBox}
            />
          ) : (
            <div
              style={{
                width: boxSize,
                height: boxSize,
                borderRadius: 8,
                border: '1px dashed #c7d4dc',
                display: 'grid',
                placeItems: 'center',
                background: '#f8fbfd',
                color: '#6d7f8d',
                fontSize: 13,
              }}
            >
              选择 bmp / jpg / png 图片
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bmp,.jpg,.jpeg,.png,image/bmp,image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={(event) => {
                void handlePickFile(event.target.files?.[0])
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()}>选择图片</Button>
            <span style={{ fontSize: 12, color: '#5f7383' }}>{fileName || '未选择文件'}</span>
          </div>

          {image ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: '#5f7383', marginBottom: 4 }}>缩放</div>
              <Slider min={1} max={3} step={0.01} value={zoom} onChange={setZoom} tooltip={{ formatter: (val) => `${Number(val).toFixed(2)}x` }} />
            </div>
          ) : null}
        </div>

        <div style={{ minWidth: 180 }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#1a2b38', fontWeight: 600 }}>预览</div>
          <AvatarPreview
            smallDataUrl={preview.smallDataUrl}
            largeDataUrl={preview.largeDataUrl}
            fallbackUrl={currentAvatarSmallUrl || ''}
          />
          <div style={{ marginTop: 12, fontSize: 12, color: '#6d7f8d', lineHeight: 1.5 }}>
            拖动方框可移动选区，拖右下角手柄可放大/缩小选区。<br />
            上传后服务端会自动转换为 jpg，并生成 32x32 与 128x128 两个尺寸。
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AvatarUploadModal
