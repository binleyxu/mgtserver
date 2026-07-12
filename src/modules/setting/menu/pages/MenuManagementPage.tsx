import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Card, message, Button, Space, Modal, Form, Input, InputNumber, Select, Switch, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'

import {
  canAccessAdminAndSettings,
  clearAdminToken,
  getAdminDisplayAvatarUrl,
  getAdminDisplayName,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  setAdminDisplayProfile,
} from '@/auth'
import { createMenu, getAdminList, getMenuList, updateMenu } from '../../../admin'
import type { MenuCreateRequest, MenuItemInfo, MenuUpdateRequest } from '../../../admin'
import { AdminScaffold } from '@/layouts/AdminScaffold'
import { buildAdminMenuItems } from '@/layouts/adminNavigation'

export const MenuManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = useState<string>(getAdminDisplayName() || '未加载姓名')
  const [currentAdminAvatarUrl, setCurrentAdminAvatarUrl] = useState<string>(getAdminDisplayAvatarUrl())
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MenuItemInfo[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItemInfo | null>(null)
  const [form] = Form.useForm()

  const role = getAdminRoleFromToken()
  const canAccessPrivilegedModules = canAccessAdminAndSettings(role)
  const menuItems = buildAdminMenuItems({
    canAccessPrivilegedModules,
    includeUser: true,
    navigate,
  })

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

  const loadMenus = async () => {
    setLoading(true)
    try {
      const response = await getMenuList()
      setItems(response.items || [])
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载菜单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentAdminName()
    loadMenus()
  }, [])

  const parentOptions = useMemo(
    () => items.map((item) => ({ label: `${item.id} - ${item.label}`, value: item.id })),
    [items],
  )

  const openCreateModal = () => {
    setEditingMenu(null)
    form.resetFields()
    form.setFieldsValue({
      sort: 0,
      is_active: true,
      path: '',
      parent_id: null,
    })
    setModalOpen(true)
  }

  const openEditModal = (menu: MenuItemInfo) => {
    setEditingMenu(menu)
    form.setFieldsValue({
      menu_key: menu.menu_key,
      label: menu.label,
      path: menu.path,
      parent_id: menu.parent_id ?? null,
      sort: menu.sort,
      is_active: menu.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      if (!editingMenu) {
        const payload: MenuCreateRequest = {
          id: Number(values.id),
          menu_key: String(values.menu_key || ''),
          label: String(values.label || ''),
          path: String(values.path || ''),
          parent_id: values.parent_id == null ? null : Number(values.parent_id),
          sort: Number(values.sort || 0),
          is_active: Boolean(values.is_active),
        }
        await createMenu(payload)
        message.success('菜单创建成功')
      } else {
        const payload: MenuUpdateRequest = {
          menu_key: String(values.menu_key || ''),
          label: String(values.label || ''),
          path: String(values.path || ''),
          parent_id: values.parent_id == null ? null : Number(values.parent_id),
          sort: Number(values.sort || 0),
          is_active: Boolean(values.is_active),
        }
        await updateMenu(Number(editingMenu.id), payload)
        message.success('菜单更新成功')
      }

      setModalOpen(false)
      setEditingMenu(null)
      form.resetFields()
      await loadMenus()
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAdminToken()
    navigate('/login', { replace: true })
  }

  const columns: ColumnsType<MenuItemInfo> = [
    { title: 'menu_id', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'key', dataIndex: 'menu_key', key: 'menu_key', width: 220 },
    { title: '名称', dataIndex: 'label', key: 'label', width: 160 },
    { title: '路径', dataIndex: 'path', key: 'path', width: 260 },
    { title: 'parent_id', dataIndex: 'parent_id', key: 'parent_id', width: 120, render: (v) => v ?? '-' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 100 },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean) => (active ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: MenuItemInfo) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <AdminScaffold
      currentAdminName={currentAdminName}
      currentAdminAvatarUrl={currentAdminAvatarUrl}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedKeys={['menu-management']}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      <div className="index-container">
        <Card
          title="菜单管理"
          className="admin-card"
          extra={
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新增菜单
              </Button>
            </Space>
          }
        >
          <Table<MenuItemInfo>
            columns={columns}
            dataSource={items}
            loading={loading}
            rowKey={(record) => record.id}
            pagination={false}
          />

          <Modal
            title={editingMenu ? `编辑菜单（menu_id: ${editingMenu.id}）` : '新增菜单'}
            open={modalOpen}
            onOk={handleSave}
            onCancel={() => {
              setModalOpen(false)
              setEditingMenu(null)
            }}
            confirmLoading={saving}
            okText={editingMenu ? '更新' : '创建'}
            cancelText="取消"
          >
            <Form form={form} layout="vertical">
              {!editingMenu && (
                <Form.Item name="id" label="menu_id" rules={[{ required: true, message: '请输入 menu_id' }]}>
                  <InputNumber style={{ width: '100%' }} min={1} precision={0} placeholder="例如：500" />
                </Form.Item>
              )}
              <Form.Item name="menu_key" label="menu_key" rules={[{ required: true, message: '请输入 menu_key' }]}>
                <Input placeholder="例如：setting.menu" />
              </Form.Item>
              <Form.Item name="label" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="例如：菜单管理" />
              </Form.Item>
              <Form.Item name="path" label="路径">
                <Input placeholder="例如：/setting/menu" />
              </Form.Item>
              <Form.Item name="parent_id" label="父级菜单">
                <Select allowClear placeholder="可为空（顶级菜单）" options={parentOptions} />
              </Form.Item>
              <Form.Item name="sort" label="排序">
                <InputNumber style={{ width: '100%' }} precision={0} />
              </Form.Item>
              <Form.Item name="is_active" label="是否启用" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </div>
    </AdminScaffold>
  )
}

export default MenuManagementPage
