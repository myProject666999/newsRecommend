import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../utils/api'
import { useAdminStore } from '../store/adminStore'

function Login() {
  const navigate = useNavigate()
  const { setUser, isLoggedIn } = useAdminStore()
  const [loading, setLoading] = useState(false)

  if (isLoggedIn) {
    return <Navigate to="/dashboard" />
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login({
        username: values.username,
        password: values.password
      })

      if (res.code === 200) {
        const { token, user } = res.data
        
        if (user.role !== 'admin') {
          message.error('非管理员账户，请前往前台登录')
          return
        }

        setUser(user, token)
        message.success('登录成功')
        navigate('/dashboard')
      }
    } catch (error) {
      message.error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8, color: '#1a1a1a' }}>新闻推荐系统</h1>
          <p style={{ color: '#666' }}>管理后台登录</p>
        </div>
        
        <Form
          name="admin_login"
          initialValues={{ username: 'admin' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
          <p>默认管理员账号：</p>
          <p>用户名: admin / 密码: admin123</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
