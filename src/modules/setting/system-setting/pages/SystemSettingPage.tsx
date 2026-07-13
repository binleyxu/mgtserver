import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Space, Switch, Tag, message } from 'antd'

import {
  canAccessAdminAndSettings,
  clearAdminToken,
  getAdminDisplayAvatarUrl,
  getAdminDisplayName,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  setAdminDisplayProfile,
} from '@/auth'
import { getAdminDetail, getAdminList, resolveAvatarUrl } from '../../../admin'
import { AdminScaffold } from '@/layouts/AdminScaffold'
import { buildAdminMenuItems } from '@/layouts/adminNavigation'
import { formatDateTimeDMY } from '@/utils/dateTimeFormat'
import { getSystemSettingProfile, updateSystemSettingProfile } from '../services/systemSettingService'

type SystemSettingFormValues = {
  siteTitle: string
  maintenanceMode: boolean
}

export const SystemSettingPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<SystemSettingFormValues>()
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(['setting'])
  const [currentAdminName, setCurrentAdminName] = useState<string>(getAdminDisplayName() || '未加载姓名')
  const [currentAdminAvatarUrl, setCurrentAdminAvatarUrl] = useState<string>(getAdminDisplayAvatarUrl())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatedAt, setUpdatedAt] = useState('')

  const role = getAdminRoleFromToken()
  const canAccessPrivilegedModules = canAccessAdminAndSettings(role)
  const menuItems = buildAdminMenuItems({
    canAccessPrivilegedModules,
    includeUser: true,
    navigate,
  })

  const handleLogout = () => {
    clearAdminToken()
    navigate('/login', { replace: true })
  }

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
      const detailAvatarUrl = resolveAvatarUrl(detail.data?.avatarSmallUrl || '', detail.data?.avatarVersion)
      setCurrentAdminName(username || '未加载姓名')
      setCurrentAdminAvatarUrl(detailAvatarUrl)
      setAdminDisplayProfile(username || undefined, detailAvatarUrl || undefined)

      if (detailAvatarUrl) {
        return
      }

      const response = await getAdminList(1, 1000)
      const adminKey = String(adminId)
      const matched = (response.data || []).find((item) => String(item.id) === adminKey || item.username === adminKey)
      if (!matched) {
        return
      }

      const matchedUsername = matched?.username || ''
      const fallbackAvatarUrl = resolveAvatarUrl(matched?.avatarSmallUrl || '', matched?.avatarVersion)
      setCurrentAdminName(matchedUsername || '未加载姓名')
      setCurrentAdminAvatarUrl(fallbackAvatarUrl)
      setAdminDisplayProfile(matchedUsername || undefined, fallbackAvatarUrl || undefined)
    } catch {
      // Keep cached display profile when network request fails.
    }
  }

  const loadSystemSetting = async () => {
    setLoading(true)
    try {
      const response = await getSystemSettingProfile()
      form.setFieldsValue({
        siteTitle: response.data.siteTitle,
        maintenanceMode: response.data.maintenanceMode,
      })
      setUpdatedAt(response.data.updatedAt)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载系统设置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCurrentAdminName()
    void loadSystemSetting()
  }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const response = await updateSystemSettingProfile(values)
      setUpdatedAt(response.data.updatedAt)
      message.success('系统设置已保存')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存系统设置失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminScaffold
      currentAdminName={currentAdminName}
      currentAdminAvatarUrl={currentAdminAvatarUrl}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedKeys={['system-setting']}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      <div className="index-container">
        <Card
          title="系统设置"
          className="admin-card"
          extra={
            updatedAt ? (
              <Tag color="blue">最后更新：{formatDateTimeDMY(updatedAt) || '-'}</Tag>
            ) : (
              <Tag>未保存</Tag>
            )
          }
          loading={loading}
        >
          <Form form={form} layout="vertical" initialValues={{ siteTitle: '管理端', maintenanceMode: false }}>
            <Form.Item
              label="系统名称"
              name="siteTitle"
              rules={[
                { required: true, message: '请输入系统名称' },
                { max: 64, message: '系统名称不能超过 64 个字符' },
              ]}
            >
              <Input placeholder="例如：管理端" />
            </Form.Item>

            <Form.Item label="维护模式" name="maintenanceMode" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>

            <Space>
              <Button type="primary" onClick={handleSave} loading={saving}>
                保存设置
              </Button>
            </Space>
          </Form>
        </Card>
      </div>
    </AdminScaffold>
  )
}

export default SystemSettingPage
