import { useEffect, useState } from 'react'

type AvatarPreviewProps = {
  smallDataUrl?: string | null
  largeDataUrl?: string | null
  fallbackUrl: string
}

export function AvatarPreview({ smallDataUrl, largeDataUrl, fallbackUrl }: AvatarPreviewProps) {
  const [smallLoadFailed, setSmallLoadFailed] = useState(false)
  const [largeLoadFailed, setLargeLoadFailed] = useState(false)

  useEffect(() => {
    setSmallLoadFailed(false)
    setLargeLoadFailed(false)
  }, [smallDataUrl, largeDataUrl, fallbackUrl])

  const small = smallDataUrl || fallbackUrl
  const large = largeDataUrl || fallbackUrl
  const canShowSmall = Boolean(small) && !smallLoadFailed
  const canShowLarge = Boolean(large) && !largeLoadFailed

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        {canShowSmall ? (
          <img
            src={small || undefined}
            alt="32x32"
            width={32}
            height={32}
            style={{ borderRadius: 6, border: '1px solid #d8e2e8' }}
            onError={() => setSmallLoadFailed(true)}
          />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 6, border: '1px dashed #d8e2e8', display: 'grid', placeItems: 'center', color: '#6d7f8d', fontSize: 10 }}>
            无
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 12, color: '#5f7383' }}>32x32</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        {canShowLarge ? (
          <img
            src={large || undefined}
            alt="128x128"
            width={128}
            height={128}
            style={{ borderRadius: 10, border: '1px solid #d8e2e8' }}
            onError={() => setLargeLoadFailed(true)}
          />
        ) : (
          <div style={{ width: 128, height: 128, borderRadius: 10, border: '1px dashed #d8e2e8', display: 'grid', placeItems: 'center', color: '#6d7f8d', fontSize: 14 }}>
            无头像
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 12, color: '#5f7383' }}>128x128</div>
      </div>
    </div>
  )
}

export default AvatarPreview
