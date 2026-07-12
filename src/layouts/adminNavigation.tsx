import type { MenuProps } from 'antd'
import { HomeOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'
import adminIcon from '@/assets/admin-icon.svg?url'
import countryGlobeIcon from '@/assets/country-globe.svg?url'
import regionManagementIcon from '@/assets/region-management.svg?url'

type BuildAdminMenuOptions = {
  canAccessPrivilegedModules: boolean
  includeUser: boolean
  navigate: (path: string) => void
}

export function buildAdminMenuItems({
  canAccessPrivilegedModules,
  includeUser,
  navigate,
}: BuildAdminMenuOptions): MenuProps['items'] {
  const baseItems: NonNullable<MenuProps['items']> = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '主页',
      onClick: () => navigate('/index'),
    },
  ]

  if (canAccessPrivilegedModules) {
    baseItems.push({
      key: 'admin',
      icon: <img src={adminIcon} alt="" width={16} height={16} className="admin-menu-icon" />,
      label: '列表',
      onClick: () => navigate('/admin'),
    })
  }

  if (includeUser) {
    baseItems.push({
      key: 'user',
      icon: <UserOutlined />,
      label: '用户',
      onClick: () => navigate('/user'),
    })
  }

  if (!canAccessPrivilegedModules) {
    return baseItems
  }

  baseItems.push({
    key: 'setting',
    icon: <SettingOutlined />,
    label: '设置',
    children: [
      {
        key: 'menu-management',
        icon: <SettingOutlined />,
        label: '菜单管理',
        onClick: () => navigate('/setting/menu'),
      },
      {
        key: 'region-management',
        icon: <img src={regionManagementIcon} alt="" width={14} height={14} className="menu-image-icon" />,
        label: '地区管理',
        children: [
          {
            key: 'country',
            icon: <img src={countryGlobeIcon} alt="" width={14} height={14} className="menu-image-icon" />,
            label: '国家',
            onClick: () => navigate('/setting/region/country'),
          },
        ],
      },
    ],
  })

  return baseItems
}