import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Menu, Card, Row, Col, Dropdown } from 'antd'
import { LogoutOutlined, UserOutlined, SettingOutlined, BarChartOutlined, FileTextOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons'
import { canAccessAdminAndSettings, clearAdminToken, getAdminIdFromToken, getAdminRoleFromToken } from '@/auth'
import '../styles/IndexPage.css'
import countryGlobeIcon from '../../../assets/country-globe.svg?url'
import regionManagementIcon from '../../../assets/region-management.svg?url'
import { getAdminDetail } from '../../admin'

const { Header, Content, Footer, Sider } = Layout

export const IndexPage: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('home')
  const [openKeys, setOpenKeys] = useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = useState<string>('管理员')

  const role = getAdminRoleFromToken()
  const canAccessPrivilegedModules = canAccessAdminAndSettings(role)

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

  const handleLogout = () => {
    clearAdminToken()
    navigate('/login', { replace: true })
  }

  const menuItems = useMemo(() => {
    const baseItems = [
      {
        key: 'home',
        icon: <DashboardOutlined />,
        label: '主页',
        onClick: () => {
          setSelectedKey('home')
        },
      },
      {
        key: 'user',
        icon: <TeamOutlined />,
        label: '用户',
        onClick: () => {
          setSelectedKey('user')
          navigate('/user')
        },
      },
    ]

    if (!canAccessPrivilegedModules) {
      return baseItems
    }

    return [
      baseItems[0],
      {
        key: 'admin',
        icon: <UserOutlined />,
        label: '管理员',
        onClick: () => {
          setSelectedKey('admin')
          navigate('/admin')
        },
      },
      baseItems[1],
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
                onClick: () => {
                  setSelectedKey('country')
                  navigate('/setting/region/country')
                },
              },
            ],
          },
        ],
      },
    ]
  }, [canAccessPrivilegedModules, navigate])

  const dashboardCards = useMemo(() => {
    const baseCards = [
      {
        key: 'user',
        icon: <TeamOutlined style={{ fontSize: 32 }} />,
        title: '用户',
        desc: '查看商城 C 端用户主数据',
        onClick: () => navigate('/user'),
      },
      {
        key: 'stats',
        icon: <BarChartOutlined style={{ fontSize: 32 }} />,
        title: '数据统计',
        desc: '查看数据报表',
      },
      {
        key: 'logs',
        icon: <FileTextOutlined style={{ fontSize: 32 }} />,
        title: '日志查看',
        desc: '查看系统日志',
      },
    ]

    if (!canAccessPrivilegedModules) {
      return baseCards
    }

    return [
      {
        key: 'admin',
        icon: <UserOutlined style={{ fontSize: 32 }} />,
        title: '管理员管理',
        desc: '管理系统用户',
        onClick: () => navigate('/admin'),
      },
      baseCards[0],
      {
        key: 'country',
        icon: <img src={countryGlobeIcon} alt="" width={32} height={32} />,
        title: '地区管理 / 国家',
        desc: '维护国家基础数据',
        onClick: () => navigate('/setting/region/country'),
      },
      baseCards[1],
      baseCards[2],
    ]
  }, [canAccessPrivilegedModules, navigate])

  useEffect(() => {
    loadCurrentAdminName()
  }, [])

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
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '登出',
                  onClick: handleLogout,
                },
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
          <Content className="index-content">
            <div className="index-container">
              <div className="welcome-section">
                <h2>欢迎使用管理后台系统</h2>
                <p>这是一个功能完整的后台管理系统</p>
              </div>

              <div className="permission-legend-section">
                <h3>权限图例</h3>
                <p>admin 资源：supervisor（super_admin）可编辑，不可删除。</p>
                <p>user 资源：viewer 只读；admin / super_admin 可编辑与删除。</p>
              </div>

              <Row gutter={[20, 20]} className="menu-grid">
                {dashboardCards.map((card) => (
                  <Col xs={24} sm={12} md={12} lg={6} key={card.key}>
                    <Card
                      className="menu-card"
                      hoverable
                      onClick={card.onClick}
                    >
                      <div className="card-content">
                        <div className="card-icon">{card.icon}</div>
                        <div className="card-title">{card.title}</div>
                        <div className="card-desc">{card.desc}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Content>

          <Footer className="index-footer">
            <p>管理后台系统 © 2024 All Rights Reserved</p>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default IndexPage
