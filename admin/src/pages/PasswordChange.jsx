import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Alert,
} from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { adminApi } from '../utils/api'

function PasswordChange() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const res = await adminApi.updatePassword({
        old_password: values.oldPassword,
        new_password: values.newPassword,
      })
      if (res.success) {
        message.success('密码修改成功')
        form.resetFields()
      }
    } catch (error) {
      message.error(error.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Alert
        message="安全提示"
        description="为了您的账户安全，请定期更换密码。密码长度至少8位，建议包含大小写字母、数字和特殊字符。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title={
          <span>
            <LockOutlined style={{ marginRight: 8 }} />
            修改密码
          </span>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[
              { required: true, message: '请输入原密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password
              placeholder="请输入原密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度不能少于8位' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: '密码需包含大小写字母和数字',
              },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="请输入新密码（至少8位，包含大小写字母和数字）"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            hasFeedback
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{ width: '100%' }}
            >
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default PasswordChange
