import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, theme } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  TagsOutlined,
  BugOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAdminStore } from '../store/adminStore'

const { Header, Sider, Content } = AntLayout

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAdminStore()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页统计',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户数据管理',
      onClick: () => navigate('/users'),
    },
    {
      key: '/news',
      icon: <FileTextOutlined />,
      label: '新闻数据管理',
      onClick: () => navigate('/news'),
    },
    {
      key: '/comments',
      icon: <MessageOutlined />,
      label: '评论管理',
      onClick: () => navigate('/comments'),
    },
    {
      key: '/tags',
      icon: <TagsOutlined />,
      label: '推荐系统管理',
      onClick: () => navigate('/tags'),
    },
    {
      key: '/crawl',
      icon: <BugOutlined />,
      label: '爬虫系统管理',
      onClick: () => navigate('/crawl'),
    },
    {
      key: '/password',
      icon: <LockOutlined />,
      label: '密码修改',
      onClick: () => navigate('/password'),
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)',
        }}>
          {collapsed ? 'NR' : '新闻推荐系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                icon={<UserOutlined />}
              />
              <span style={{ fontWeight: 500 }}>{user?.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
