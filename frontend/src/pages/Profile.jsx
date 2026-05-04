import { useState, useEffect } from 'react'
import { Card, Button, Form, Input, message, Modal, Tabs, Statistic, Row, Col, Tag, Empty } from 'antd'
import { UserOutlined, EditOutlined, LockOutlined, StarOutlined } from '@ant-design/icons'
import { userApi, recommendApi } from '../utils/api'
import { useUserStore } from '../store/userStore'

const { TabPane } = Tabs
const { TextArea } = Input

function Profile() {
  const { user, updateUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [userTags, setUserTags] = useState([])
  const [stats, setStats] = useState(null)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    fetchUserTags()
    fetchStats()
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const fetchUserTags = async () => {
    try {
      const res = await userApi.getTags()
      if (res.code === 200) {
        setUserTags(res.data || [])
      }
    } catch (error) {
      console.error('获取用户标签失败:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await recommendApi.getStats()
      if (res.code === 200) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('获取统计失败:', error)
    }
  }

  const handleUpdateProfile = async (values) => {
    setLoading(true)
    try {
      const res = await userApi.updateProfile({
        email: values.email,
        phone: values.phone
      })
      if (res.code === 200) {
        updateUser({
          email: values.email,
          phone: values.phone
        })
        message.success('个人信息更新成功')
      }
    } catch (error) {
      message.error(error.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (values) => {
    try {
      const res = await userApi.updatePassword({
        old_password: values.oldPassword,
        new_password: values.newPassword
      })
      if (res.code === 200) {
        message.success('密码修改成功')
        setPasswordModalVisible(false)
        passwordForm.resetFields()
      }
    } catch (error) {
      message.error(error.message || '密码修改失败')
    }
  }

  const getTagColor = (weight) => {
    if (weight >= 3) return '#722ed1'
    if (weight >= 2) return '#531dab'
    if (weight >= 1) return '#9254de'
    return '#b37feb'
  }

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Card className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{user?.username}</h2>
            <p>角色: {user?.role === 'admin' ? '管理员' : '普通用户'}</p>
            <p>注册时间: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
          </div>
          <Button
            type="primary"
            icon={<LockOutlined />}
            onClick={() => setPasswordModalVisible(true)}
            style={{ marginLeft: 'auto' }}
          >
            修改密码
          </Button>
        </div>

        <Row gutter={24} className="stats-grid">
          <Col span={6}>
            <div className="stat-item">
              <div className="stat-value">{stats?.tag_count || 0}</div>
              <div className="stat-label">兴趣标签</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-item">
              <div className="stat-value">{stats?.history_count || 0}</div>
              <div className="stat-label">浏览历史</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-item">
              <div className="stat-value">{stats?.recommend_count || 0}</div>
              <div className="stat-label">推荐新闻</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-item">
              <div className="stat-value">
                {userTags.length > 0 
                  ? (userTags.reduce((sum, t) => sum + (t.weight || 0), 0) / userTags.length).toFixed(1)
                  : 0
                }
              </div>
              <div className="stat-label">平均权重</div>
            </div>
          </Col>
        </Row>

        <Tabs defaultActiveKey="1">
          <TabPane tab={<span><UserOutlined /> 个人信息</span>} key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              style={{ maxWidth: 500 }}
            >
              <Form.Item
                name="username"
                label="用户名"
              >
                <Input disabled prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="手机号"
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<EditOutlined />}
                >
                  更新信息
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><StarOutlined /> 兴趣标签</span>} key="2">
            {userTags.length > 0 ? (
              <div>
                <p style={{ marginBottom: 16, color: '#666' }}>
                  以下是根据您的浏览行为生成的兴趣标签，权重越高表示您越感兴趣。
                  系统会根据标签为您推荐相关新闻。
                </p>
                <div className="tags-cloud">
                  {userTags
                    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
                    .map((tag, index) => (
                      <Tag
                        key={tag.id}
                        className="tag-item"
                        style={{
                          backgroundColor: getTagColor(tag.weight),
                          color: 'white',
                          border: 'none',
                          fontSize: 14 + Math.min(tag.weight, 2),
                          padding: '6px 16px'
                        }}
                      >
                        {tag.tag?.name}
                        <span className="tag-weight" style={{ color: 'rgba(255,255,255,0.8)' }}>
                          权重: {tag.weight?.toFixed(1)}
                        </span>
                      </Tag>
                    ))}
                </div>
              </div>
            ) : (
              <Empty
                description={
                  <div>
                    <p>暂无兴趣标签</p>
                    <p style={{ color: '#999', fontSize: 12 }}>多浏览新闻，系统会自动为您生成兴趣标签</p>
                  </div>
                }
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleUpdatePassword}
        >
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
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
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => {
                setPasswordModalVisible(false)
                passwordForm.resetFields()
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Profile
