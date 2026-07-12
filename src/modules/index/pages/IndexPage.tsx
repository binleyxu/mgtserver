import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col } from 'antd'
import { UserOutlined, BarChartOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons'
import {
  canAccessAdminAndSettings,
  clearAdminToken,
  getAdminDisplayAvatarUrl,
  getAdminDisplayName,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  setAdminDisplayProfile,
} from '@/auth'
import '../styles/IndexPage.css'
import countryGlobeIcon from '@/assets/country-globe.svg?url'
import { getAdminDetail, getAdminList } from '../../admin'
import { AdminScaffold } from '@/layouts/AdminScaffold'
import { buildAdminMenuItems } from '@/layouts/adminNavigation'

export const IndexPage: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const selectedKey = 'home'
  const [openKeys, setOpenKeys] = useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = useState<string>(getAdminDisplayName() || '未加载姓名')
  const [currentAdminAvatarUrl, setCurrentAdminAvatarUrl] = useState<string>(getAdminDisplayAvatarUrl())

  const role = getAdminRoleFromToken()
  const canAccessPrivilegedModules = canAccessAdminAndSettings(role)

  const loadCurrentAdminName = async () => {
    const adminId = getAdminIdFromToken()
    if (!adminId) {
      setCurrentAdminName('未加载姓名')
      setCurrentAdminAvatarUrl('')
      return
    }

    try {
      const detail = await getAdminDetail(adminId)
      const username = detail.data?.username || ''
      setCurrentAdminName(username || '未加载姓名')
      setCurrentAdminAvatarUrl(detail.data?.avatarSmallUrl || '')
      setAdminDisplayProfile(username || undefined, detail.data?.avatarSmallUrl || undefined)

      if (!detail.data?.avatarSmallUrl) {
        const response = await getAdminList(1, 1000)
        const adminKey = String(adminId)
        const matched = (response.data || []).find((item) => String(item.id) === adminKey || item.username === adminKey)
        if (matched?.avatarSmallUrl) {
          setCurrentAdminAvatarUrl(matched.avatarSmallUrl)
          setAdminDisplayProfile(username || undefined, matched.avatarSmallUrl)
        }
      }
      return
    } catch (error) {
      console.warn('[IndexPage] 加载管理员详情失败，回退到列表查找。', error)
    }

    try {
      const response = await getAdminList(1, 1000)
      const adminKey = String(adminId)
      const matched = (response.data || []).find((item) => String(item.id) === adminKey || item.username === adminKey)
      if (!matched) {
        return
      }
      setCurrentAdminName(matched?.username || '未加载姓名')
      setCurrentAdminAvatarUrl(matched?.avatarSmallUrl || '')
      setAdminDisplayProfile(matched?.username || undefined, matched?.avatarSmallUrl || undefined)
    } catch (error) {
      console.warn('[IndexPage] 加载管理员列表也失败。', error)
      // Keep cached display profile when network request fails.
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
      currentAdminAvatarUrl={currentAdminAvatarUrl}
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
