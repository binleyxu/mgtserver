export type AvatarSize = 32 | 128

export type AvatarCropRect = {
  x: number
  y: number
  size: number
}

export type AvatarImageMeta = {
  width: number
  height: number
}

export type AdminAvatarPayload = {
  admin_id: string
  avatar_small_url: string
  avatar_large_url: string
  avatar_version?: number
  avatar_updated_at?: string
}

export type UploadAvatarParams = {
  adminId: string
  file: File
  crop: AvatarCropRect
  imageMeta: AvatarImageMeta
}

export type UploadAvatarResult = {
  adminId: string
  avatarSmallUrl: string
  avatarLargeUrl: string
  avatarVersion?: number
  avatarUpdatedAt?: string
}

export type AvatarPreview = {
  smallDataUrl: string | null
  largeDataUrl: string | null
}

export type AvatarCanvasView = {
  canvasSize: number
  cropBoxSize: number
  renderedWidth: number
  renderedHeight: number
  minPanX: number
  maxPanX: number
  minPanY: number
  maxPanY: number
}
