import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Form, Input, Button, Card, message, Modal, Spin } from 'antd'
import { Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useLogin } from '../hooks/useLogin'
import { ApiHttpError, getHumanChallenge } from '@/auth'
import type { AdminLoginRequest } from '@/auth'
import '../styles/LoginPage.css'

const LOGIN_BLOCKED_UNTIL_KEY = 'admin_login_blocked_until'
const VALIDATION_BLOCKED_UNTIL_KEY = 'admin_validation_blocked_until'

const readStoredTimestamp = (key: string): number | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) {
    return null
  }

  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

export const LoginPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, loading } = useLogin()
  const [form] = Form.useForm()
  const [humanVerified, setHumanVerified] = useState(false)
  const [humanChecked, setHumanChecked] = useState(false)
  const [humanToken, setHumanToken] = useState<string | null>(null)
  const [humanLoading, setHumanLoading] = useState(false)
  const [validationBlockedUntil, setValidationBlockedUntil] = useState<number | null>(() =>
    readStoredTimestamp(VALIDATION_BLOCKED_UNTIL_KEY)
  )
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<number | null>(() =>
    readStoredTimestamp(LOGIN_BLOCKED_UNTIL_KEY)
  )
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null)
  const fromMaintenance = Boolean((location.state as { maintenance?: boolean } | null)?.maintenance)

  const challengeStatusMessage =
    loginFeedback ??
    (humanVerified ? '已通过人机验证，您可以登录。' : '请先勾选“我不是机器人”并等待验证完成。')

  const resetHumanChallenge = (feedback?: string | null) => {
    setHumanChecked(false)
    setHumanVerified(false)
    setHumanToken(null)
    setExpiresAt(null)
    setRemainingSeconds(null)
    setLoginFeedback(feedback ?? null)
  }

  const showLoginError = (messageText: string) => {
    if (
      messageText.includes('human_token') ||
      messageText.includes('人机') ||
      messageText.includes('challenge')
    ) {
      resetHumanChallenge(`人机验证失败：${messageText}`)
      message.error(`人机验证失败：${messageText}`)
      return
    }

    // 账号/密码错误等登录失败时，回到初始登录态（不保留人机验证通过状态）。
    resetHumanChallenge()
    message.error(messageText)
  }

  React.useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null)
      return
    }
    const tick = () => {
      const secs = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setRemainingSeconds(secs)
      if (secs <= 0) {
        resetHumanChallenge('人机验证已过期，请重新勾选后再试。')
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (validationBlockedUntil) {
        window.localStorage.setItem(VALIDATION_BLOCKED_UNTIL_KEY, String(validationBlockedUntil))
      } else {
        window.localStorage.removeItem(VALIDATION_BLOCKED_UNTIL_KEY)
      }
    }

    if (!validationBlockedUntil && !loginBlockedUntil) {
      return
    }
    const check = () => {
      const now = Date.now()
      if (validationBlockedUntil && now >= validationBlockedUntil) {
        setValidationBlockedUntil(null)
      }
      if (loginBlockedUntil && now >= loginBlockedUntil) {
        setLoginBlockedUntil(null)
      }
    }
    check()
    const timer = setInterval(check, 1000)
    return () => clearInterval(timer)
  }, [validationBlockedUntil, loginBlockedUntil])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (loginBlockedUntil) {
        window.localStorage.setItem(LOGIN_BLOCKED_UNTIL_KEY, String(loginBlockedUntil))
      } else {
        window.localStorage.removeItem(LOGIN_BLOCKED_UNTIL_KEY)
      }
    }
  }, [loginBlockedUntil])

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      const data: AdminLoginRequest = { username: values.username.trim(), password: values.password }
      if (humanVerified && humanToken) {
        data.human_token = humanToken
      }
      const response = await login(data)
      if (response.success && response.access_token) {
        message.success('登录成功')
        navigate('/index', { replace: true })
        setLoginBlockedUntil(null)
        return
      }
      showLoginError(response.message || '登录失败')
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 429 && err.retryAfterSeconds) {
        const until = Date.now() + err.retryAfterSeconds * 1000
        if (err.lockType === 'human') {
          setValidationBlockedUntil(until)
          setLoginFeedback(err.message)
          resetHumanChallenge(err.message)
        } else {
          setLoginBlockedUntil(until)
          showLoginError(err.message)
        }
        return
      }

      const errMsg = err instanceof Error ? err.message : '登录请求失败'
      showLoginError(errMsg)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card" title={<h1 className="login-title">管理员登录</h1>}>
          {fromMaintenance && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="系统维护中"
              description="当前仅允许白名单账号访问，其他账号已被暂时限制登录。"
            />
          )}
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={humanChecked}
                  disabled={humanLoading || (validationBlockedUntil !== null && Date.now() < validationBlockedUntil)}
                  onChange={async (e) => {
                    const checked = e.target.checked
                    setHumanChecked(checked)
                    setHumanVerified(false)
                    setHumanToken(null)
                    if (checked) {
                      setLoginFeedback(null)
                      if (validationBlockedUntil && Date.now() < validationBlockedUntil) {
                        setHumanChecked(false)
                        Modal.info({
                          title: '人机验证已锁定',
                          content: '验证失败次数已达上限，请1小时后再试。',
                        })
                        return
                      }

                      setHumanLoading(true)
                      try {
                        const challenge = await getHumanChallenge()
                        if (challenge && challenge.id) {
                          setHumanToken(challenge.id)
                          setHumanVerified(true)
                          setLoginFeedback('已通过人机验证，可以继续登录。')
                          if (challenge.expires_in) {
                            const at = Date.now() + Number(challenge.expires_in) * 1000
                            setExpiresAt(at)
                            setRemainingSeconds(Number(challenge.expires_in))
                          } else {
                            setExpiresAt(null)
                            setRemainingSeconds(null)
                          }
                        } else {
                          const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
                          setHumanToken(token)
                          setHumanVerified(true)
                          setLoginFeedback('已通过人机验证，可以继续登录。')
                          setExpiresAt(null)
                          setRemainingSeconds(null)
                        }
                      } catch (err) {
                        setHumanChecked(false)
                        setHumanVerified(false)
                        setHumanToken(null)
                        if (err instanceof ApiHttpError && err.status === 429 && err.retryAfterSeconds) {
                          const until = Date.now() + err.retryAfterSeconds * 1000
                          setValidationBlockedUntil(until)
                          setLoginFeedback(err.message)
                          Modal.info({
                            title: '人机验证锁定',
                            content: err.message,
                          })
                        } else {
                          setLoginFeedback('人机验证失败，请重新勾选后再试。')
                          message.error(err instanceof Error ? err.message : '获取人机挑战失败，请重试')
                        }
                      } finally {
                        setHumanLoading(false)
                      }
                    } else {
                      resetHumanChallenge()
                    }
                  }}
                >我不是机器人</Checkbox>
                {humanLoading && <Spin size="small" style={{ marginLeft: 8 }} />}
              </div>
            </Form.Item>
            <div
              style={{
                marginBottom: 12,
                color: challengeStatusMessage.includes('失败') || challengeStatusMessage.includes('过期') ? '#cf1322' : '#888',
                fontSize: 12,
              }}
            >
              {challengeStatusMessage}
            </div>
            {expiresAt && remainingSeconds !== null && remainingSeconds > 0 && (
                <div style={{ marginBottom: 8, color: '#888' }}>
                  挑战剩余时间: {Math.floor((remainingSeconds || 0) / 60)}:{String((remainingSeconds || 0) % 60).padStart(2, '0')}
                </div>
              )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                disabled={!humanVerified || !humanToken || humanLoading || (loginBlockedUntil !== null && Date.now() < loginBlockedUntil)}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
