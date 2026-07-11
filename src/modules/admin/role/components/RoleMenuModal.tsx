import React from 'react'
import { Checkbox, Modal } from 'antd'

import type { MenuItemInfo } from '../../types/admin.types'

type RoleMenuModalProps = {
  open: boolean
  confirmLoading: boolean
  roleName?: string
  menuCatalog: MenuItemInfo[]
  selectedRoleMenuIds: number[]
  onChangeSelectedIds: (ids: number[]) => void
  onOk: () => void
  onCancel: () => void
}

export const RoleMenuModal: React.FC<RoleMenuModalProps> = ({
  open,
  confirmLoading,
  roleName,
  menuCatalog,
  selectedRoleMenuIds,
  onChangeSelectedIds,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={roleName ? `角色菜单配置 - ${roleName}` : '角色菜单配置'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="保存"
      cancelText="取消"
      width={720}
    >
      <div style={{ marginBottom: 12, color: '#8c8c8c' }}>
        勾选该角色可见的左侧菜单（menu_id）
      </div>
      <Checkbox.Group
        style={{ width: '100%' }}
        value={selectedRoleMenuIds}
        onChange={(checkedValues) => onChangeSelectedIds((checkedValues as number[]).map((v) => Number(v)))}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {menuCatalog.map((menu) => (
            <label
              key={menu.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <Checkbox value={menu.id} />
              <span style={{ fontWeight: 600 }}>{menu.id}</span>
              <span>{menu.label}</span>
              <span style={{ color: '#8c8c8c', marginLeft: 'auto' }}>{menu.path || '-'}</span>
            </label>
          ))}
        </div>
      </Checkbox.Group>
    </Modal>
  )
}
