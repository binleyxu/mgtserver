import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col } from 'antd'
import { UserOutlined, BarChartOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons'
import { canAccessAdminAndSettings, clearAdminToken, getAdminIdFromToken, getAdminRoleFromToken } from '@/auth'
import '../styles/IndexPage.css'
import countryGlobeIcon from '../../../assets/country-globe.svg?url'
import { getAdminDetail } from '../../admin'
import { AdminScaffold } from '@/layouts/AdminScaffold'
import { buildAdminMenuItems } from '@/layouts/adminNavigation'

export const IndexPage: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const selectedKey = 'home'
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

  const menuItems = useMemo(() => buildAdminMenuItems({
    canAccessPrivilegedModules,
    includeUser: true,
    navigate,
  }), [canAccessPrivilegedModules, navigate])

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
    <AdminScaffold
      currentAdminName={currentAdminName}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      menuItems={menuItems}
      onLogout={handleLogout}
      showFooter
    >
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
    </AdminScaffold>
  )
}

export default IndexPage
