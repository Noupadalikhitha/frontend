import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Settings, 
  MessageSquare,
  LogOut,
  Menu,
  X
} from 'lucide-react'

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
  }

  const userRole = user?.role_name || 'Staff'
  
  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/employees', label: 'Employees', icon: Users, roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/finance', label: 'Finance', icon: DollarSign, roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/admin', label: 'Admin', icon: Settings, roles: ['Admin'] },
    { path: '/ai-chat', label: 'AI Assistant', icon: MessageSquare, roles: ['Admin', 'Manager', 'Staff'] },
  ]
  
  const navItems = allNavItems.filter(item => item.roles.includes(userRole))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-lg font-bold text-blue-600">ERP System</p>
              <p className="text-xs text-gray-500">Role: {userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity lg:hidden ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col z-40 transform transition-transform lg:transform-none lg:static lg:shadow-none ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">ERP System</h1>
              <p className="text-xs text-gray-500 mt-1">Welcome back</p>
            </div>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-50 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-4 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 ${
                    isActive ? 'bg-blue-50 border-r-4 border-blue-600 font-semibold' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4 bg-white">
            <div className="flex flex-col mb-2">
              <span className="text-sm font-medium text-gray-800 truncate">{user?.email || 'User'}</span>
              <span className="text-xs text-gray-500">
                Role: {user?.role_name || 'Staff'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto lg:ml-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

