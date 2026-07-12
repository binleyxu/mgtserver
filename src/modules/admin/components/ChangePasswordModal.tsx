import React, { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'

type ChangePasswordModalProps = {
  open: boolean
  confirmLoading: boolean
  targetAdminName?: string
  onSubmit: (nextPassword: string) => void | Promise<void>
  onCancel: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  confirmLoading,
  targetAdminName,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (!open) {
      form.resetFields()
    }
  }, [form, open])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onSubmit(String(values.password || ''))
  }

  return (
    <Modal
      title={targetAdminName ? `更改密码 - ${targetAdminName}` : '更改密码'}
      open={open}
      onOk={() => {
        void handleOk()
      }}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="更新密码"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少 6 位' },
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
