import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Dropdown, Avatar, Menu, message } from 'antd'
import {
  HomeOutlined,
  FireOutlined,
  StarOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useUserStore } from '../store/userStore'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/')
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
        个人中心
      </Menu.Item>
      <Menu.Item key="recommend" icon={<StarOutlined />} onClick={() => navigate('/recommend')}>
        我的推荐
      </Menu.Item>
      <Menu.Item key="history" icon={<HistoryOutlined />} onClick={() => navigate('/history')}>
        浏览历史
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  const navItems = [
    { key: '/', label: '首页', icon: <HomeOutlined />, path: '/' },
    { key: '/hot', label: '时事热点', icon: <FireOutlined />, path: '/hot' },
  ]

  if (isLoggedIn) {
    navItems.push({ key: '/recommend', label: '推荐页', icon: <StarOutlined />, path: '/recommend' })
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo" onClick={() => navigate('/')}>
          <FireOutlined style={{ fontSize: 24 }} />
          新闻推荐系统
        </div>

        <nav className="header-nav">
          {navItems.map((item) => (
            <Button
              key={item.key}
              type="link"
              icon={item.icon}
              onClick={() => navigate(item.path)}
              style={{
                color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: location.pathname === item.path ? 600 : 400
              }}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="header-user">
          {isLoggedIn ? (
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'white' }}>
              <Avatar
                size={32}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  cursor: 'pointer'
                }}
                icon={<UserOutlined />}
              />
              <span>{user?.username}</span>
            </div>
          </Dropdown>
          ) : (
            <>
              <Button
                type="link"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                登录
              </Button>
              <Button
                type="primary"
                onClick={() => navigate('/register')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'transparent',
                  color: 'white'
                }}
              >
                注册
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout
