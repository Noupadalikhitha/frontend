import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Employees from './pages/Employees'
import Finance from './pages/Finance'
import Admin from './pages/Admin'
import AIChat from './pages/AIChat'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function PrivateRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<Sales />} />
          <Route path="employees" element={<Employees />} />
          <Route path="finance" element={<Finance />} />
          <Route 
            path="admin" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="ai-chat" element={<AIChat />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

