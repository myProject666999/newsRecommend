import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdminStore } from './store/adminStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import NewsManagement from './pages/NewsManagement'
import CommentManagement from './pages/CommentManagement'
import TagManagement from './pages/TagManagement'
import CrawlManagement from './pages/CrawlManagement'
import PasswordChange from './pages/PasswordChange'

function PrivateRoute({ children }) {
  const { isLoggedIn } = useAdminStore()
  return isLoggedIn ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/news" element={<NewsManagement />} />
                <Route path="/comments" element={<CommentManagement />} />
                <Route path="/tags" element={<TagManagement />} />
                <Route path="/crawl" element={<CrawlManagement />} />
                <Route path="/password" element={<PasswordChange />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default App
