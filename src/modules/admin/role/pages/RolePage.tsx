import React, { useEffect, useState } from 'react'
import { Button, Card, message, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

import type { Role } from '../types/role.types'
import { getRoleList } from '../services/roleService'
import { formatDateDMY } from '../../../../utils/dateTimeFormat'

export const RolePage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)

  const loadRoles = async () => {
    setLoading(true)
    try {
      const response = await getRoleList()
      setRoles(response.items || [])
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载角色失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  return (
    <Card
      title="角色管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={loadRoles}>
          刷新
        </Button>
      }
    >
      <Table
        loading={loading}
        dataSource={roles}
        rowKey={(record: Role) => record.id}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
          { title: '角色名', dataIndex: 'role_name', key: 'role_name' },
          {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (isActive ? '启用' : '禁用'),
          },
          {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date: string) => formatDateDMY(date),
          },
        ]}
      />
    </Card>
  )
}

export default RolePage
