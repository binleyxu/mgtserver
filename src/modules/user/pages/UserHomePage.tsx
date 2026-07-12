import React from 'react'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'

import { useUserList } from '../hooks/useUserList'
import type { UserProfile } from '../types/user.types'
import '../styles/UserHomePage.css'
import {
  canAccessAdminAndSettings,
  clearAdminToken,
  getAdminDisplayAvatarUrl,
  getAdminDisplayName,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  setAdminDisplayProfile,
} from '@/auth'
import { getAdminList } from '@/modules/admin'
import { AdminScaffold } from '@/layouts/AdminScaffold'
import { buildAdminMenuItems } from '@/layouts/adminNavigation'

const columns: ColumnsType<UserProfile> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'UUID', dataIndex: 'uuid', key: 'uuid', width: 200 },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 140 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140, render: (value?: string | null) => value || '-' },
  { title: '注册来源', dataIndex: 'registerSource', key: 'registerSource', width: 140 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: (value: UserProfile['status']) => (
      <Tag color={value === 'active' ? 'green' : 'red'}>{value}</Tag>
    ),
  },
]

export const UserHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { userList, loading, error, page, pageSize, total, setPage, setPageSize } = useUserList()
  const [collapsed, setCollapsed] = React.useState(false)
  const [openKeys, setOpenKeys] = React.useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = React.useState<string>(getAdminDisplayName() || '未加载姓名')
  const [currentAdminAvatarUrl, setCurrentAdminAvatarUrl] = React.useState<string>(getAdminDisplayAvatarUrl())

  const role = getAdminRoleFromToken()
  const canAccessPrivilegedModules = canAccessAdminAndSettings(role)

  const menuItems = React.useMemo(() => buildAdminMenuItems({
    canAccessPrivilegedModules,
    includeUser: true,
    navigate,
  }), [canAccessPrivilegedModules, navigate])

  React.useEffect(() => {
    const loadCurrentAdminName = async () => {
      const adminId = getAdminIdFromToken()
      if (!adminId) {
        setCurrentAdminName('未加载姓名')
        setCurrentAdminAvatarUrl('')
        return
      }

      try {
        const response = await getAdminList(1, 1000)
        const adminKey = String(adminId)
        const matched = (response.data || []).find((item) => String(item.id) === adminKey || item.username === adminKey)
        if (!matched) {
          return
        }
        const username = matched?.username || ''
        setCurrentAdminName(username || '未加载姓名')
        setCurrentAdminAvatarUrl(matched?.avatarSmallUrl || '')
        setAdminDisplayProfile(username || undefined, matched?.avatarSmallUrl || undefined)
      } catch {
        // Keep cached display profile when network request fails.
      }
    }

    void loadCurrentAdminName()
  }, [])

  const handleLogout = () => {
    clearAdminToken()
    navigate('/login', { replace: true })
  }

  return (
    <AdminScaffold
      currentAdminName={currentAdminName}
      currentAdminAvatarUrl={currentAdminAvatarUrl}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedKeys={['user']}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      <div className="user-page">
        {error ? <div className="user-page-error">{error}</div> : null}
        <Table<UserProfile>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={userList}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: { showSearch: false },
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              if (nextPageSize && nextPageSize !== pageSize) {
                setPageSize(nextPageSize)
              }
            },
          }}
          scroll={{ x: 980 }}
        />
      </div>
    </AdminScaffold>
  )
}

export default UserHomePage
