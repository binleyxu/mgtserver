type AvatarPreviewProps = {
  smallDataUrl?: string | null
  largeDataUrl?: string | null
  fallbackUrl: string
}

export function AvatarPreview({ smallDataUrl, largeDataUrl, fallbackUrl }: AvatarPreviewProps) {
  const small = smallDataUrl || fallbackUrl
  const large = largeDataUrl || fallbackUrl

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <img src={small} alt="32x32" width={32} height={32} style={{ borderRadius: 6, border: '1px solid #d8e2e8' }} />
        <div style={{ marginTop: 6, fontSize: 12, color: '#5f7383' }}>32 x 32</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <img src={large} alt="128x128" width={128} height={128} style={{ borderRadius: 10, border: '1px solid #d8e2e8' }} />
        <div style={{ marginTop: 6, fontSize: 12, color: '#5f7383' }}>128 x 128</div>
      </div>
    </div>
  )
}

export default AvatarPreview
