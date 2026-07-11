import React from 'react'
import { Button, Modal, Popconfirm, Space, Table } from 'antd'
import { DeleteOutlined, EditOutlined, FileSearchOutlined, PlusOutlined } from '@ant-design/icons'

import { formatDateDMY } from '../../../../utils/dateTimeFormat'
import type { Role } from '../types/role.types'

type RolePanelModalProps = {
  open: boolean
  loading: boolean
  roles: Role[]
  onCancel: () => void
  onCreateRole: () => void
  onEditRole: (role: Role) => void
  onDeleteRole: (role: Role) => void
  onConfigRoleMenu: (role: Role) => void
}

export const RolePanelModal: React.FC<RolePanelModalProps> = ({
  open,
  loading,
  roles,
  onCancel,
  onCreateRole,
  onEditRole,
  onDeleteRole,
  onConfigRoleMenu,
}) => {
  return (
    <Modal title="角色管理" open={open} onCancel={onCancel} footer={null} width={860}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateRole}>
          新增角色
        </Button>
      </div>
      <Table
        loading={loading}
        dataSource={roles}
        rowKey={(record: Role) => record.id}
        pagination={false}
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
          },
          {
            title: '角色名',
            dataIndex: 'role_name',
            key: 'role_name',
            width: 220,
          },
          {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (isActive: boolean) => (
              <span style={{ color: isActive ? '#52c41a' : '#f5222d', fontWeight: 600 }}>{isActive ? '启用' : '禁用'}</span>
            ),
          },
          {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 240,
            render: (date: string) => formatDateDMY(date),
          },
          {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_: unknown, role: Role) => {
              const isSeedRole = ['super_admin', 'admin', 'ops_admin', 'viewer'].includes(role.role_name)
              return (
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEditRole(role)}
                    aria-label="编辑角色"
                  />
                  <Button
                    size="small"
                    icon={<FileSearchOutlined />}
                    onClick={() => onConfigRoleMenu(role)}
                    aria-label="配置角色菜单"
                  />
                  {isSeedRole ? (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled
                      title="系统初始角色不建议删除"
                      aria-label="删除角色"
                    />
                  ) : (
                    <Popconfirm
                      title="删除角色"
                      description="删除后会自动迁移引用该角色的管理员，确定继续？"
                      onConfirm={() => onDeleteRole(role)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button danger size="small" icon={<DeleteOutlined />} aria-label="删除角色" />
                    </Popconfirm>
                  )}
                </Space>
              )
            },
          },
        ]}
      />
    </Modal>
  )
}
