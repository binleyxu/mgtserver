import React from 'react'
import { Alert, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'

import { useUserList } from '../hooks/useUserList'
import type { UserProfile } from '../types/user.types'
import '../styles/UserHomePage.css'
import { canAccessAdminAndSettings, clearAdminToken, getAdminIdFromToken, getAdminRoleFromToken } from '@/auth'
import { getAdminDetail } from '@/modules/admin'
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
  const { userList, source, loading, error } = useUserList()
  const [collapsed, setCollapsed] = React.useState(false)
  const [openKeys, setOpenKeys] = React.useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = React.useState<string>('管理员')

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
        setCurrentAdminName('管理员')
        return
      }

      try {
        const response = await getAdminDetail(adminId)
        const username = response.data?.username || ''
        setCurrentAdminName(username || '管理员')
      } catch {
        setCurrentAdminName('管理员')
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
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedKeys={['user']}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      <div className="user-page">
        <h2>用户模块（商城 C 端骨架）</h2>
        <p>主键为自增整数 ID，分布式标识为 UUID（用于跨项目外链）。</p>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="权限说明"
          description="user 资源：viewer 只读；admin / super_admin 可编辑与删除。supervisor（super_admin）允许编辑和删除用户。"
        />
        <Alert
          type={source === 'legacy' ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          message="数据源"
          description={source === 'legacy' ? '当前使用降级端点 /user/list。' : source === 'admin' ? '当前使用主端点 /admin/user/list。' : '正在检测可用数据源。'}
        />
        {error ? <div className="user-page-error">{error}</div> : null}
        <Table<UserProfile>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={userList}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 980 }}
        />
      </div>
    </AdminScaffold>
  )
}

export default UserHomePage
