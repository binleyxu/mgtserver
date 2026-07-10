import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Menu, Table, Card, Dropdown, message, Button, Space, Modal, Form, Input, InputNumber, Select, Switch, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { DashboardOutlined, UserOutlined, SettingOutlined, LogoutOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons"
import { clearAdminToken, getAdminIdFromToken } from "@/auth"
import { createMenu, getAdminDetail, getMenuList, updateMenu } from "../../../admin"
import type { MenuCreateRequest, MenuItemInfo, MenuUpdateRequest } from "../../../admin"
import "../../../index/styles/IndexPage.css"
import countryGlobeIcon from "../../../../assets/country-globe.svg?url"
import regionManagementIcon from "../../../../assets/region-management.svg?url"

const { Header, Content, Sider } = Layout

export const MenuManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(["setting", "region-management"])
  const [currentAdminName, setCurrentAdminName] = useState<string>("管理员")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MenuItemInfo[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItemInfo | null>(null)
  const [form] = Form.useForm()

  const loadCurrentAdminName = async () => {
    const adminId = getAdminIdFromToken()
    if (!adminId) {
      setCurrentAdminName("管理员")
      return
    }

    try {
      const response = await getAdminDetail(adminId)
      const username = response.data?.username || ""
      setCurrentAdminName(username || "管理员")
    } catch {
      setCurrentAdminName("管理员")
    }
  }

  const loadMenus = async () => {
    setLoading(true)
    try {
      const response = await getMenuList()
      setItems(response.items || [])
    } catch (err) {
      message.error(err instanceof Error ? err.message : "加载菜单列表失败")
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
    [items]
  )

  const openCreateModal = () => {
    setEditingMenu(null)
    form.resetFields()
    form.setFieldsValue({
      sort: 0,
      is_active: true,
      path: "",
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
          menu_key: String(values.menu_key || ""),
          label: String(values.label || ""),
          path: String(values.path || ""),
          parent_id: values.parent_id == null ? null : Number(values.parent_id),
          sort: Number(values.sort || 0),
          is_active: Boolean(values.is_active),
        }
        await createMenu(payload)
        message.success("菜单创建成功")
      } else {
        const payload: MenuUpdateRequest = {
          menu_key: String(values.menu_key || ""),
          label: String(values.label || ""),
          path: String(values.path || ""),
          parent_id: values.parent_id == null ? null : Number(values.parent_id),
          sort: Number(values.sort || 0),
          is_active: Boolean(values.is_active),
        }
        await updateMenu(Number(editingMenu.id), payload)
        message.success("菜单更新成功")
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
    navigate("/login", { replace: true })
  }

  const menuItems = [
    { key: "home", icon: <DashboardOutlined />, label: "主页", onClick: () => navigate("/index") },
    { key: "admin", icon: <UserOutlined />, label: "管理员", onClick: () => navigate("/admin") },
    { key: "user", icon: <UserOutlined />, label: "用户", onClick: () => navigate("/user") },
    {
      key: "setting",
      icon: <SettingOutlined />,
      label: "设置",
      children: [
        {
          key: "menu-management",
          icon: <SettingOutlined />,
          label: "菜单管理",
          onClick: () => navigate("/setting/menu"),
        },
        {
          key: "region-management",
          icon: <img src={regionManagementIcon} alt="" width={14} height={14} style={{ filter: "invert(1)" }} />,
          label: "地区管理",
          children: [
            {
              key: "country",
              icon: <img src={countryGlobeIcon} alt="" width={14} height={14} style={{ filter: "invert(1)" }} />,
              label: "国家",
              onClick: () => navigate("/setting/region/country"),
            },
          ],
        },
      ],
    },
  ]

  const columns: ColumnsType<MenuItemInfo> = [
    { title: "menu_id", dataIndex: "id", key: "id", width: 120 },
    { title: "key", dataIndex: "menu_key", key: "menu_key", width: 220 },
    { title: "名称", dataIndex: "label", key: "label", width: 160 },
    { title: "路径", dataIndex: "path", key: "path", width: 260 },
    { title: "parent_id", dataIndex: "parent_id", key: "parent_id", width: 120, render: (v) => v ?? "-" },
    { title: "排序", dataIndex: "sort", key: "sort", width: 100 },
    {
      title: "状态",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (active: boolean) => (active ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: unknown, record: MenuItemInfo) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
          编辑
        </Button>
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
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "登出",
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <div
              style={{
                color: "#1f1f1f",
                background: "rgba(255, 255, 255, 0.92)",
                borderRadius: 16,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 10px",
                cursor: "pointer",
              }}
            >
              <UserOutlined />
              <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                {currentAdminName || "管理员"}
              </span>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout className="index-layout-container">
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="index-sider" width={220}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={["menu-management"]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            items={menuItems}
          />
        </Sider>

        <Layout>
          <Content className="index-content">
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
              </Card>

              <Modal
                title={editingMenu ? `编辑菜单（menu_id: ${editingMenu.id}）` : "新增菜单"}
                open={modalOpen}
                onOk={handleSave}
                onCancel={() => {
                  setModalOpen(false)
                  setEditingMenu(null)
                }}
                confirmLoading={saving}
                okText={editingMenu ? "更新" : "创建"}
                cancelText="取消"
              >
                <Form form={form} layout="vertical">
                  {!editingMenu && (
                    <Form.Item name="id" label="menu_id" rules={[{ required: true, message: "请输入 menu_id" }]}>
                      <InputNumber style={{ width: "100%" }} min={1} precision={0} placeholder="例如：500" />
                    </Form.Item>
                  )}
                  <Form.Item name="menu_key" label="menu_key" rules={[{ required: true, message: "请输入 menu_key" }]}>
                    <Input placeholder="例如：setting.menu" />
                  </Form.Item>
                  <Form.Item name="label" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
                    <Input placeholder="例如：菜单管理" />
                  </Form.Item>
                  <Form.Item name="path" label="路径">
                    <Input placeholder="例如：/setting/menu" />
                  </Form.Item>
                  <Form.Item name="parent_id" label="父级菜单">
                    <Select allowClear placeholder="可为空（顶级菜单）" options={parentOptions} />
                  </Form.Item>
                  <Form.Item name="sort" label="排序">
                    <InputNumber style={{ width: "100%" }} precision={0} />
                  </Form.Item>
                  <Form.Item name="is_active" label="是否启用" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Form>
              </Modal>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default MenuManagementPage
