import { useEffect, useMemo, useState, type PropsWithChildren, type ReactNode } from 'react'
import { Layout, Menu, Breadcrumb, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation } from 'react-router-dom'
import { LogoutOutlined } from '@ant-design/icons'
import avatarFallbackUrl from '@/assets/avatar-fallback.jpg?url'

const fallbackAvatarUrl = avatarFallbackUrl

import './AdminScaffold.css'

const { Header, Content, Footer } = Layout

type MenuNode = {
  key?: string
  icon?: ReactNode
  label?: ReactNode
  onClick?: () => void
  children?: MenuNode[]
}

const findFirstLeafClick = (item?: MenuNode): (() => void) | undefined => {
  if (!item) return undefined
  if (item.onClick) return item.onClick
  if (!item.children?.length) return undefined

  for (const child of item.children) {
    const click = findFirstLeafClick(child)
    if (click) return click
  }

  return undefined
}

const containsSelectedKey = (item: MenuNode, selectedKeySet: Set<string>): boolean => {
  if (item.key && selectedKeySet.has(item.key)) return true
  if (!item.children?.length) return false
  return item.children.some((child) => containsSelectedKey(child, selectedKeySet))
}

const findActiveRoot = (items: MenuNode[], selectedKeySet: Set<string>): MenuNode | undefined =>
  items.find((item) => containsSelectedKey(item, selectedKeySet))

const buildSecondaryMenuItems = (activeRoot?: MenuNode): MenuProps['items'] => {
  if (!activeRoot) return []

  if (activeRoot.children?.length) {
    return activeRoot.children as MenuProps['items']
  }

  return [
    {
      key: activeRoot.key ?? 'active-root',
      icon: activeRoot.icon,
      label: activeRoot.label,
      onClick: activeRoot.onClick,
    },
  ]
}

const routeBreadcrumbMap: Record<string, string> = {
  '/index': '主页',
  '/home': '主页',
  '/admin': '管理员',
  '/user': '用户',
  '/setting': '设置',
  '/setting/menu': '菜单管理',
  '/setting/system-setting': '系统设置',
  '/setting/region': '地区管理',
  '/setting/region/country': '国家',
}

const buildBreadcrumbItems = (pathname: string) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const segments = normalizedPath.split('/').filter(Boolean)

  if (!segments.length) {
    return [{ title: '主页' }]
  }

  const items: Array<{ title: ReactNode }> = []
  let currentPath = ''

  for (const segment of segments) {
    currentPath += `/${segment}`
    items.push({ title: routeBreadcrumbMap[currentPath] || segment })
  }

  return items
}

type AdminScaffoldProps = PropsWithChildren<{
  title?: string
  siderTitle?: ReactNode
  currentAdminName: string
  currentAdminAvatarUrl?: string | null
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  selectedKeys: string[]
  openKeys?: string[]
  onOpenChange?: (openKeys: string[]) => void
  menuItems: MenuProps['items']
  onLogout: () => void
  showFooter?: boolean
  footerText?: string
  contentClassName?: string
}>

export const AdminScaffold = ({
  title = '管理端',
  siderTitle,
  currentAdminName,
  currentAdminAvatarUrl,
  collapsed,
  onCollapse: _onCollapse,
  selectedKeys,
  openKeys,
  onOpenChange,
  menuItems,
  onLogout,
  showFooter = false,
  footerText = '管理后台系统 © 2026 All Rights Reserved',
  contentClassName,
  children,
}: AdminScaffoldProps) => {
  const location = useLocation()
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const normalizedItems = (menuItems ?? []) as MenuNode[]
  const selectedKeySet = new Set(selectedKeys)
  const normalizedAdminName = currentAdminName?.trim() || '未加载姓名'
  const effectiveAvatarUrl = currentAdminAvatarUrl?.trim() || ''

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [effectiveAvatarUrl])

  const shouldUseFallbackAvatarImage = normalizedAdminName === '未加载姓名'
  const shouldUseAvatarImage = useMemo(() => {
    const avatarUrl = effectiveAvatarUrl
    if (!avatarUrl) return false
    if (avatarLoadFailed) return false

    // Back-end default placeholder is a data-uri SVG avatar silhouette; prefer initial fallback instead.
    if (avatarUrl.startsWith('data:image/svg+xml')) return false

    return true
  }, [avatarLoadFailed, effectiveAvatarUrl])

  const railItems: MenuProps['items'] = normalizedItems
    .filter((item) => item?.key && item?.icon)
    .map((item) => {
      const clickHandler = findFirstLeafClick(item)

      return {
        key: item.key as string,
        icon: item.icon,
        label: item.label,
        onClick: clickHandler,
      }
    })

  const activeRoot = findActiveRoot(normalizedItems, selectedKeySet)
  const activeRailKey = activeRoot?.key
  const secondaryMenuItems = buildSecondaryMenuItems(activeRoot)
  const breadcrumbItems = buildBreadcrumbItems(location.pathname)

  return (
    <Layout className="admin-scaffold-layout">
      <Header className="admin-scaffold-header">
        <div className="admin-scaffold-header-brand">
          <div className="admin-scaffold-header-left">
            <img className="admin-scaffold-brand-image" src="/logo.png" alt="管理端 logo" />
          </div>

          <div className="admin-scaffold-header-center">
            <h1 className="admin-scaffold-title">{title}</h1>
          </div>
        </div>

        <div className="admin-scaffold-header-right">
          <Breadcrumb items={breadcrumbItems} className="admin-scaffold-breadcrumb" />
        </div>
      </Header>

      <div className="admin-scaffold-body">
        <aside className="admin-scaffold-rail">
          <Menu
            mode="inline"
            selectedKeys={activeRailKey ? [activeRailKey] : []}
            items={railItems}
            className="admin-scaffold-rail-menu"
            inlineCollapsed
          />

          <div className="admin-scaffold-rail-footer">
            <Dropdown
              trigger={['hover']}
              placement="rightBottom"
              arrow
              menu={{
                items: [
                  {
                    key: 'admin-profile',
                    label: (
                      <span className="admin-scaffold-dropdown-profile">
                        {shouldUseAvatarImage ? (
                          <img
                            src={effectiveAvatarUrl || undefined}
                            alt={normalizedAdminName}
                            className="admin-scaffold-dropdown-avatar-image"
                            onError={() => setAvatarLoadFailed(true)}
                          />
                        ) : shouldUseFallbackAvatarImage ? (
                          <img
                            src={fallbackAvatarUrl}
                            alt="未加载姓名"
                            className="admin-scaffold-dropdown-avatar-image admin-scaffold-user-avatar-fallback-image"
                          />
                        ) : (
                          <span className="admin-scaffold-dropdown-avatar-fallback">
                            {normalizedAdminName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className="admin-scaffold-dropdown-profile-name">{normalizedAdminName}</span>
                      </span>
                    ),
                    disabled: true,
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出',
                    onClick: onLogout,
                  },
                ],
              }}
            >
              <button type="button" className="admin-scaffold-user-trigger" aria-label="管理员菜单">
                {shouldUseAvatarImage ? (
                  <img
                    src={effectiveAvatarUrl || undefined}
                    alt={normalizedAdminName}
                    className="admin-scaffold-user-avatar-image"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : shouldUseFallbackAvatarImage ? (
                  <img
                    src={fallbackAvatarUrl}
                    alt="未加载姓名"
                    className="admin-scaffold-user-avatar-image admin-scaffold-user-avatar-fallback-image"
                  />
                ) : (
                  <span className="admin-scaffold-user-avatar-fallback">
                    {normalizedAdminName.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>
            </Dropdown>
          </div>
        </aside>

        <aside className={`admin-scaffold-sider${collapsed ? ' is-collapsed' : ''}`}>
          <div className="admin-scaffold-sider-title">
            <span className="admin-scaffold-sider-title-text">{siderTitle || activeRoot?.label || title}</span>
          </div>
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            items={secondaryMenuItems}
            className="admin-scaffold-menu"
          />
        </aside>

        <main className="admin-scaffold-main">
          <Content className={`admin-scaffold-content${contentClassName ? ` ${contentClassName}` : ''}`}>
            {children}
          </Content>
          {showFooter ? <Footer className="admin-scaffold-footer">{footerText}</Footer> : null}
        </main>
      </div>
    </Layout>
  )
}

export default AdminScaffold