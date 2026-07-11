import React from 'react'
import { Form, Input, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'

import type { Role } from '../types/role.types'

const { Option } = Select

type RoleFormModalProps = {
  open: boolean
  confirmLoading: boolean
  editingRole: Role | null
  form: FormInstance
  onOk: () => void
  onCancel: () => void
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  open,
  confirmLoading,
  editingRole,
  form,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={editingRole ? '编辑角色' : '新增角色'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={editingRole ? '更新' : '创建'}
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="role_name"
          label="角色名"
          rules={[{ required: true, message: '请输入角色名' }]}
        >
          <Input placeholder="请输入角色名" />
        </Form.Item>
        <Form.Item
          name="is_active"
          label="状态"
          initialValue={true}
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select>
            <Option value={true}>启用</Option>
            <Option value={false}>禁用</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
