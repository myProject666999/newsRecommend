import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import HotNews from './pages/HotNews'
import NewsDetail from './pages/NewsDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Recommend from './pages/Recommend'
import Profile from './pages/Profile'
import History from './pages/History'
import './App.css'

function PrivateRoute({ children }) {
  const { isLoggedIn } = useUserStore()
  return isLoggedIn ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hot" element={<HotNews />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/recommend"
          element={
            <PrivateRoute>
              <Recommend />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          }
        />
      </Routes>
    </Layout>
  )
}

export default App
