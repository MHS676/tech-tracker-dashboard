import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Technicians from './pages/Technicians'
import Jobs from './pages/Jobs'
import Admins from './pages/Admins'
import LiveMap from './pages/LiveMap'

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Overview />} />
        <Route path="live-map" element={<LiveMap />} />
        <Route path="technicians" element={<Technicians />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="admins" element={<Admins />} />
      </Route>
    </Routes>
  )
}

export default App
