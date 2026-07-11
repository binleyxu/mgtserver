import React, { useState, useEffect } from 'react'
import type {
  Admin,
  AdminListResponse,
  UpdateAdminRequest,
  MenuItemInfo,
} from '../types/admin.types'
import type { Role, UpdateRoleRequest } from '../role'
import {
  getAdminList,
  deleteAdmin,
  createAdmin,
  updateAdmin,
  getAdminDetail,
  getMenuList,
} from '../services/adminService'
import { createRole, deleteRole, getRoleList, getRoleMenu, updateRole, updateRoleMenu } from '../role'
import { Table, Button, Space, Card, Layout, Popconfirm, message, Modal, Form, Input, Select, Menu, Dropdown, Tooltip } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined, SettingOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import '../styles/AdminPage.css'
import '../../index/styles/IndexPage.css'
import { formatDateDMY } from '../../../utils/dateTimeFormat'
import countryGlobeIcon from '../../../assets/country-globe.svg?url'
import regionManagementIcon from '../../../assets/region-management.svg?url'
import roleManagementActionIcon from '../../../assets/role-management-action.svg?url'
import { clearAdminToken, getAdminIdFromToken } from '@/auth'
import { RoleFormModal, RoleMenuModal, RolePanelModal } from '../role'

const { Header, Content, Sider } = Layout
const { Option } = Select

/**
 * Admin 管理页面
 */
export const AdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const visibleRoles = roles.filter((role) => role.role_name !== 'super_admin')
  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [form] = Form.useForm()

  const [rolePanelVisible, setRolePanelVisible] = useState(false)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [roleConfirmLoading, setRoleConfirmLoading] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm] = Form.useForm()
  const [menuCatalog, setMenuCatalog] = useState<MenuItemInfo[]>([])
  const [roleMenuModalVisible, setRoleMenuModalVisible] = useState(false)
  const [roleMenuSaving, setRoleMenuSaving] = useState(false)
  const [editingRoleMenus, setEditingRoleMenus] = useState<Role | null>(null)
  const [selectedRoleMenuIds, setSelectedRoleMenuIds] = useState<number[]>([])

  const [collapsed, setCollapsed] = useState(false)
  const selectedKey = 'admin'
  const [openKeys, setOpenKeys] = useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = useState<string>('管理员')


  const handleLogout = () => {
    clearAdminToken()
    navigate('/login', { replace: true })
  }

  const menuItems = [
    { key: 'home', icon: <DashboardOutlined />, label: '主页', onClick: () => navigate('/index') },
    { key: 'admin', icon: <UserOutlined />, label: '管理员', onClick: () => navigate('/admin') },
    { key: 'user', icon: <UserOutlined />, label: '用户', onClick: () => navigate('/user') },
    {
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
          icon: <img src={regionManagementIcon} alt="" width={14} height={14} style={{ filter: 'invert(1)' }} />,
          label: '地区管理',
          children: [
            {
              key: 'country',
              icon: <img src={countryGlobeIcon} alt="" width={14} height={14} style={{ filter: 'invert(1)' }} />,
              label: '国家',
              onClick: () => navigate('/setting/region/country'),
            },
          ],
        },
      ],
    },
  ]

  const loadAdmins = async () => {
    setLoading(true)
    setError(null)
    try {
      const response: AdminListResponse = await getAdminList(page, pageSize)
      setAdmins(response.data || [])
      setTotal(response.total || 0)
    } catch (err) {
      const messageText = err instanceof Error ? err.message : '加载失败'
      setError(messageText)
      message.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    setRoleLoading(true)
    try {
      const response = await getRoleList()
      setRoles(response.items || [])
    } catch (err) {
      const messageText = err instanceof Error ? err.message : '加载角色失败'
      message.error(messageText)
    } finally {
      setRoleLoading(false)
    }
  }

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

  const handleDelete = async (id: string) => {
    if (!id) {
      message.error('无法删除：未提供 numeric ID')
      return
    }
    try {
      await deleteAdmin(id)
      message.success('删除成功')
      loadAdmins()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const openCreateModal = () => {
    setEditingAdmin(null)
    form.resetFields()
    if (visibleRoles.length > 0) {
      form.setFieldsValue({ role_id: visibleRoles[0].id, status: 'active' })
    }
    setIsModalVisible(true)
  }

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin)
    form.setFieldsValue({
      username: admin.username ?? admin.id,
      name: admin.name,
      email: admin.email,
      role_id: admin.roleId,
      status: admin.status,
      password: undefined,
    })
    setIsModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      if (editingAdmin) {
        if (!editingAdmin.id) {
          message.error('无法更新：未提供 numeric ID')
          return
        }
        const updateData: UpdateAdminRequest = {
          name: values.name,
          email: values.email,
          role_id: Number(values.role_id),
          is_active: values.status === 'active',
        }
        if (values.password) {
          updateData.password = values.password
        }
        await updateAdmin(editingAdmin.id, updateData)
        message.success('更新成功')
      } else {
        await createAdmin({
          username: values.username,
          name: values.name,
          email: values.email,
          role_id: Number(values.role_id),
          password: values.password,
        })
        message.success('创建成功')
      }
      setIsModalVisible(false)
      setEditingAdmin(null)
      form.resetFields()
      loadAdmins()
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message)
      }
    } finally {
      setConfirmLoading(false)
    }
  }

  const openRolePanel = () => {
    setRolePanelVisible(true)
    loadRoles()
  }

  const openCreateRoleModal = () => {
    setEditingRole(null)
    roleForm.resetFields()
    roleForm.setFieldsValue({ is_active: true })
    setRoleModalVisible(true)
  }

  const openEditRoleModal = (role: Role) => {
    setEditingRole(role)
    roleForm.setFieldsValue({ role_name: role.role_name, is_active: role.is_active })
    setRoleModalVisible(true)
  }

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields()
      setRoleConfirmLoading(true)

      if (editingRole) {
        const payload: UpdateRoleRequest = {
          role_name: values.role_name,
          is_active: Boolean(values.is_active),
        }
        await updateRole(editingRole.id, payload)
        message.success('角色更新成功')
      } else {
        await createRole({
          role_name: values.role_name,
          is_active: Boolean(values.is_active),
        })
        message.success('角色创建成功')
      }

      setRoleModalVisible(false)
      setEditingRole(null)
      roleForm.resetFields()
      loadRoles()
      loadAdmins()
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message)
      }
    } finally {
      setRoleConfirmLoading(false)
    }
  }

  const handleDeleteRole = async (role: Role) => {
    try {
      await deleteRole(role.id)
      message.success('角色删除成功')
      loadRoles()
      loadAdmins()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除角色失败')
    }
  }

  const openRoleMenuModal = async (role: Role) => {
    try {
      setRoleLoading(true)
      const [menuResp, roleMenuResp] = await Promise.all([
        getMenuList(),
        getRoleMenu(role.id),
      ])
      setMenuCatalog(menuResp.items || [])
      setSelectedRoleMenuIds(roleMenuResp.menu_ids || [])
      setEditingRoleMenus(role)
      setRoleMenuModalVisible(true)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载角色菜单失败')
    } finally {
      setRoleLoading(false)
    }
  }

  const handleSaveRoleMenus = async () => {
    if (!editingRoleMenus) {
      return
    }
    try {
      setRoleMenuSaving(true)
      await updateRoleMenu(editingRoleMenus.id, selectedRoleMenuIds)
      message.success('角色菜单保存成功')
      setRoleMenuModalVisible(false)
      setEditingRoleMenus(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存角色菜单失败')
    } finally {
      setRoleMenuSaving(false)
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const handleRoleCancel = () => {
    setRoleModalVisible(false)
  }

  useEffect(() => {
    loadAdmins()
    loadRoles()
    loadCurrentAdminName()
  }, [page])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <span style={{
          color: status === 'active' ? '#52c41a' : '#f5222d',
          fontWeight: 600,
        }}>
          {status === 'active' ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateDMY(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: Admin) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            aria-label="编辑"
          />
          <Popconfirm
            title="删除管理员"
            description="确定要删除此管理员吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              aria-label="删除"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Layout className="index-page-layout">
      <Header className="index-header">
        <div className="header-left">
          <h1 className="header-title">管理后台</h1>
        </div>
        <div className="header-right">
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: '登出', onClick: handleLogout },
              ],
            }}
          >
            <div
              style={{
                color: '#1f1f1f',
                background: 'rgba(255, 255, 255, 0.92)',
                borderRadius: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 10px',
                cursor: 'pointer',
              }}
            >
              <UserOutlined />
              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {currentAdminName || '管理员'}
              </span>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout className="index-layout-container">
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="index-sider"
          width={220}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            items={menuItems}
          />
        </Sider>

        <Layout>
          <Content className="index-content admin-content">
            <div className="admin-page">
              <Card
                title={<div className="admin-title">管理员列表</div>}
                extra={
                  <Space>
                    <Tooltip title="角色管理">
                      <Button
                        shape="circle"
                        icon={<img src={roleManagementActionIcon} alt="" width={16} height={16} />}
                        onClick={openRolePanel}
                      />
                    </Tooltip>
                    <Tooltip title="新增管理员">
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                      />
                    </Tooltip>
                  </Space>
                }
                className="admin-card"
              >
                {error && (
                  <div style={{
                    padding: '12px',
                    marginBottom: '16px',
                    background: '#fff2e8',
                    border: '1px solid #ffbb96',
                    borderRadius: '4px',
                    color: '#d4380d',
                  }}>
                    {error}
                  </div>
                )}

                <Table
                  columns={columns}
                  dataSource={admins}
                  loading={loading}
                  rowKey={(record: Admin) => record.id || record.username}
                  pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    onChange: (newPage) => setPage(newPage),
                    showSizeChanger: false,
                  }}
                />

                <RolePanelModal
                  open={rolePanelVisible}
                  loading={roleLoading}
                  roles={visibleRoles}
                  onCancel={() => setRolePanelVisible(false)}
                  onCreateRole={openCreateRoleModal}
                  onEditRole={openEditRoleModal}
                  onDeleteRole={handleDeleteRole}
                  onConfigRoleMenu={openRoleMenuModal}
                />

                <Modal
                  title={editingAdmin ? '编辑管理员' : '新增管理员'}
                  open={isModalVisible}
                  onOk={handleSubmit}
                  onCancel={handleCancel}
                  confirmLoading={confirmLoading}
                  okText={editingAdmin ? '更新' : '创建'}
                  cancelText="取消"
                >
                  <Form form={form} layout="vertical">
                    <Form.Item
                      name="username"
                      label="用户名"
                      rules={editingAdmin ? [] : [{ required: true, message: '请输入用户名' }]}
                    >
                      <Input placeholder="请输入用户名" disabled={!!editingAdmin} />
                    </Form.Item>
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                    >
                      <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item
                      name="role_id"
                      label="角色"
                      rules={[{ required: true, message: '请选择角色' }]}
                    >
                      <Select placeholder="请选择角色">
                        {visibleRoles.map((role) => (
                          <Option key={role.id} value={role.id}>
                            {role.role_name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="status"
                      label="状态"
                      initialValue="active"
                      rules={[{ required: true, message: '请选择状态' }]}
                    >
                      <Select>
                        <Option value="active">启用</Option>
                        <Option value="inactive">禁用</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="password"
                      label="密码"
                      rules={
                        editingAdmin
                          ? []
                          : [{ required: true, message: '请输入密码' }]
                      }
                    >
                      <Input.Password placeholder={editingAdmin ? '留空则不修改密码' : '请输入密码'} />
                    </Form.Item>
                  </Form>
                </Modal>

                <RoleMenuModal
                  open={roleMenuModalVisible}
                  confirmLoading={roleMenuSaving}
                  roleName={editingRoleMenus?.role_name}
                  menuCatalog={menuCatalog}
                  selectedRoleMenuIds={selectedRoleMenuIds}
                  onChangeSelectedIds={setSelectedRoleMenuIds}
                  onOk={handleSaveRoleMenus}
                  onCancel={() => {
                    setRoleMenuModalVisible(false)
                    setEditingRoleMenus(null)
                  }}
                />

                <RoleFormModal
                  open={roleModalVisible}
                  confirmLoading={roleConfirmLoading}
                  editingRole={editingRole}
                  form={roleForm}
                  onOk={handleRoleSubmit}
                  onCancel={handleRoleCancel}
                />
              </Card>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default AdminPage
