import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Space, Table, Tag, message, Modal, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SyncOutlined, QuestionCircleOutlined, EditOutlined, FileSearchOutlined } from '@ant-design/icons'
import '../styles/CountryPage.css'
import {
  canAccessAdminAndSettings,
  clearAdminToken,
  getAdminDisplayAvatarUrl,
  getAdminDisplayName,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  setAdminDisplayProfile,
} from '@/auth'
import { getAdminList } from '../../../admin'
import { getCountryList, getCountrySyncRuns, updateCountryDisplayName } from '../services/countryService'
import type { Country, CountrySyncSummary } from '../types/country.types'
import { formatDateTimeDMY } from '../../../../utils/dateTimeFormat'
import { useCountrySyncFlow } from '../hooks/useCountrySyncFlow'
import { AdminScaffold } from '@/layouts/AdminScaffold'
import { buildAdminMenuItems } from '@/layouts/adminNavigation'

function getFlagImageUrl(cca2: string) {
  const code = (cca2 || '').trim().toLowerCase()
  if (!code || code.length !== 2) {
    return ''
  }

  return `https://flagcdn.com/24x18/${code}.png`
}

function createTaiwanFallback(nextId: number): Country {
  const now = new Date().toISOString()
  return {
    id: nextId,
    countryCode: 'TW',
    sourceNameCommon: 'Taiwan',
    cca2: 'TW',
    cca3: 'TWN',
    ccn3: '158',
    callingCode: '+886',
    nameCommon: '台湾',
    nameOfficial: 'Taiwan',
    region: 'Asia',
    subregion: 'Eastern Asia',
    capital: ['Taipei'],
    population: 23500000,
    area: 36193,
    flagEmoji: '🇹🇼',
    flagPng: getFlagImageUrl('TW'),
    currencies: {},
    languages: {},
    independent: true,
    unMember: false,
    updatedAt: now,
  }
}

function ensureTaiwanCountry(countries: Country[]): Country[] {
  const hasTaiwan = countries.some((item) => {
    const cca2 = (item.cca2 || '').trim().toUpperCase()
    const cca3 = (item.cca3 || '').trim().toUpperCase()
    const name = `${item.nameCommon || ''} ${item.nameOfficial || ''} ${item.sourceNameCommon || ''}`.toLowerCase()
    return cca2 === 'TW' || cca3 === 'TWN' || name.includes('taiwan') || name.includes('台湾')
  })

  if (hasTaiwan) {
    return countries
  }

  const maxId = countries.reduce((max, item) => (item.id > max ? item.id : max), 0)
  return [...countries, createTaiwanFallback(maxId + 1)]
}

export const CountryPage: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(['setting', 'region-management'])
  const [currentAdminName, setCurrentAdminName] = useState<string>(getAdminDisplayName() || '未加载姓名')
  const [currentAdminAvatarUrl, setCurrentAdminAvatarUrl] = useState<string>(getAdminDisplayAvatarUrl())
  const [loading, setLoading] = useState(false)
  const [countryList, setCountryList] = useState<Country[]>([])
  const [sourceModalOpen, setSourceModalOpen] = useState(false)
  const [syncLogModalOpen, setSyncLogModalOpen] = useState(false)
  const [syncRuns, setSyncRuns] = useState<CountrySyncSummary[]>([])
  const [syncRunsLoading, setSyncRunsLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  const handleLogout = () => {
    clearAdminToken()
    navigate('/login', { replace: true })
  }

  const role = getAdminRoleFromToken()
  const canAccessPrivilegedModules = canAccessAdminAndSettings(role)
  const menuItems = buildAdminMenuItems({
    canAccessPrivilegedModules,
    includeUser: true,
    navigate,
  })

  const loadCountry = async () => {
    setLoading(true)
    try {
      const response = await getCountryList()
      setCountryList(ensureTaiwanCountry(response.data || []))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载国家数据失败')
    } finally {
      setLoading(false)
    }
  }

  const {
    syncing,
    syncModalOpen,
    syncModalMode,
    syncCountdown,
    syncResult,
    syncResultError,
    openSyncModal,
    closeSyncModal,
    startSync,
    isSyncRunning,
  } = useCountrySyncFlow({
    onSyncSuccess: loadCountry,
  })

  const loadSyncRuns = async () => {
    setSyncRunsLoading(true)
    try {
      const response = await getCountrySyncRuns()
      setSyncRuns(response.data || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载同步日志失败')
    } finally {
      setSyncRunsLoading(false)
    }
  }

  const openSyncLogModal = () => {
    setSyncLogModalOpen(true)
    void loadSyncRuns()
  }

  useEffect(() => {
    loadCountry()
    loadCurrentAdminName()
  }, [])

  useEffect(() => {
    if (!isSyncRunning) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = '同步进行中，暂不允许刷新或关闭页面。'
      return event.returnValue
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isReloadShortcut = event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')
      if (isReloadShortcut) {
        event.preventDefault()
        message.warning('同步进行中，暂不允许刷新页面')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSyncRunning])

  const openEditModal = (country: Country) => {
    setEditingCountry(country)
    setEditName(country.nameCommon || '')
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingCountry(null)
    setEditName('')
    setSavingEdit(false)
  }

  const handleSaveEdit = async () => {
    if (!editingCountry) {
      return
    }

    const normalized = editName.trim()
    if (!normalized) {
      message.warning('国家名称不能为空')
      return
    }

    setSavingEdit(true)
    try {
      const response = await updateCountryDisplayName(editingCountry.id, normalized)

      setCountryList((prev) => prev.map((item) => (item.id === response.data.id ? response.data : item)))
      message.success('保存成功')
      closeEditModal()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
      setSavingEdit(false)
    }
  }

  const columns: ColumnsType<Country> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      fixed: 'left',
    },
    {
      title: '国旗',
      key: 'flag',
      width: 64,
      render: (_: unknown, row: Country) => (
        <div className="country-flag-cell">
          {getFlagImageUrl(row.cca2) ? (
            <img
              className="country-flag-image"
              src={getFlagImageUrl(row.cca2)}
              alt={`${row.nameCommon} flag`}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null
                if (fallback) {
                  fallback.style.display = 'inline-flex'
                }
              }}
            />
          ) : null}
          <span
            className="country-flag-fallback"
            style={{ display: getFlagImageUrl(row.cca2) ? 'none' : 'inline-flex' }}
          >
            {row.flagEmoji || '🏳️'}
          </span>
        </div>
      ),
    },
    {
      title: '国家',
      dataIndex: 'nameCommon',
      key: 'nameCommon',
      width: 180,
    },
    {
      title: '电话区号',
      key: 'callingCode',
      width: 110,
      render: (_: unknown, row: Country) => <Tag color="cyan">{row.callingCode || '-'}</Tag>,
    },
    {
      title: '二位码',
      dataIndex: 'cca2',
      key: 'cca2',
      width: 84,
      render: (value: string) => <Tag>{value || '-'}</Tag>,
    },
    {
      title: '三位码',
      dataIndex: 'cca3',
      key: 'cca3',
      width: 84,
      render: (value: string) => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: '编辑',
      key: 'edit',
      width: 90,
      render: (_: unknown, row: Country) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEditModal(row)}
          aria-label={`编辑${row.nameCommon}`}
        />
      ),
    },
  ], [])

  const syncLogColumns: ColumnsType<CountrySyncSummary> = useMemo(() => [
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (value: string) => formatDateTimeDMY(value),
    },
    {
      title: '触发方式',
      dataIndex: 'reason',
      key: 'reason',
      width: 120,
      render: (value: string) => <Tag>{value || '-'}</Tag>,
    },
    {
      title: '结果',
      dataIndex: 'success',
      key: 'success',
      width: 90,
      render: (value: boolean) => (value ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>),
    },
    {
      title: '统计',
      key: 'stats',
      width: 220,
      render: (_: unknown, row: CountrySyncSummary) => (
        <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: 2 }}>
          <div>新增</div><div>{row.inserted}条</div>
          <div>更新</div><div>{row.updated}条</div>
          <div>未变化</div><div>{row.unchanged}条</div>
          <div>移除</div><div>{row.removed}条</div>
        </div>
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'error',
      key: 'error',
      render: (value?: string) => value || '-',
    },
  ], [])

  return (
    <AdminScaffold
      currentAdminName={currentAdminName}
      currentAdminAvatarUrl={currentAdminAvatarUrl}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedKeys={['country']}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      <div className="country-page">
        <Card className="country-card" title="地区管理 / 国家">
                <div className="country-toolbar">
                  <Space size={0} style={{ marginLeft: 'auto' }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<SyncOutlined />}
                      onClick={openSyncModal}
                      loading={syncing}
                      aria-label="同步公网国家数据"
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<FileSearchOutlined />}
                      onClick={openSyncLogModal}
                      aria-label="查看同步日志"
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<QuestionCircleOutlined />}
                      onClick={() => setSourceModalOpen(true)}
                      aria-label="查看国家数据来源说明"
                    />
                  </Space>
                </div>

                <Table
                  className="country-table"
                  rowKey={(row) => row.id}
                  columns={columns}
                  dataSource={countryList}
                  loading={loading}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '8px 0' }}>
                        <div style={{ marginBottom: 8 }}>暂无国家数据，请先执行一次同步</div>
                        <Button type="primary" size="small" icon={<SyncOutlined />} onClick={openSyncModal} loading={syncing}>
                          立即同步
                        </Button>
                      </div>
                    ),
                  }}
                  scroll={{ x: 740 }}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: false,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />

                <Modal
                  title={syncModalMode === 'result' ? '同步完成' : syncModalMode === 'running' ? '同步进行中' : '确认同步公网国家数据？'}
                  open={syncModalOpen}
                  closable={syncModalMode !== 'running'}
                  mask={{ closable: false }}
                  onCancel={() => {
                    closeSyncModal()
                  }}
                  footer={syncModalMode === 'confirm' ? [
                    <Button key="cancel" onClick={closeSyncModal}>取消</Button>,
                    <Button key="ok" type="primary" onClick={() => { void startSync() }} loading={syncing}>确认同步</Button>,
                  ] : syncModalMode === 'result' ? [
                    <Button key="done" type="primary" onClick={closeSyncModal}>知道了</Button>,
                  ] : null}
                >
                  {syncModalMode === 'confirm' && (
                    <div>该操作会从公网拉取国家数据，并更新本地国家列表。</div>
                  )}

                  {syncModalMode === 'running' && (
                    <div>
                      <div>正在同步公网数据，请稍候...</div>
                      <div style={{ marginTop: 8 }}>倒计时：{syncCountdown}s</div>
                      <div style={{ marginTop: 8, color: '#999' }}>同步进行中，已禁止关闭此弹窗，并会拦截刷新或关闭页面。</div>
                    </div>
                  )}

                  {syncModalMode === 'result' && syncResult && (
                    <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: 2 }}>
                      <div>新增</div><div>{syncResult.inserted}条</div>
                      <div>更新</div><div>{syncResult.updated}条</div>
                      <div>未变化</div><div>{syncResult.unchanged}条</div>
                      <div>移除</div><div>{syncResult.removed}条</div>
                    </div>
                  )}

                  {syncModalMode === 'result' && !syncResult && syncResultError && (
                    <div style={{ color: '#cf1322' }}>{syncResultError}</div>
                  )}
                </Modal>

                <Modal
                  title="国家数据来源说明"
                  open={sourceModalOpen}
                  footer={null}
                  onCancel={() => setSourceModalOpen(false)}
                >
                  <p>采用 World Bank 官方国家接口（免费、无需 key、长期稳定）：</p>
                  <p>
                    <a
                      href="https://api.worldbank.org/v2/country?format=json&per_page=400"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://api.worldbank.org/v2/country?format=json&per_page=400
                    </a>
                  </p>
                  <p>自动同步：每年 1 月 1 日 00:00</p>
                </Modal>

                <Modal
                  title="国家同步日志"
                  open={syncLogModalOpen}
                  footer={null}
                  width={980}
                  onCancel={() => setSyncLogModalOpen(false)}
                >
                  <Table
                    rowKey={(row) => `${row.startedAt}-${row.reason}`}
                    columns={syncLogColumns}
                    dataSource={syncRuns}
                    loading={syncRunsLoading}
                    pagination={{
                      pageSize: 8,
                      showSizeChanger: false,
                      showTotal: (total) => `共 ${total} 条`,
                    }}
                    scroll={{ x: 860 }}
                  />
                </Modal>

                <Modal
                  title="编辑国家展示名称"
                  open={editModalOpen}
                  onCancel={closeEditModal}
                  onOk={handleSaveEdit}
                  okText="保存"
                  cancelText="取消"
                  confirmLoading={savingEdit}
                >
                  <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
                    这里只修改前端展示名称，不会修改 World Bank 原始名称。
                  </div>
                  <Input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    maxLength={200}
                    placeholder="请输入国家展示名称"
                  />
                </Modal>
        </Card>
      </div>
    </AdminScaffold>
  )
}

export default CountryPage
