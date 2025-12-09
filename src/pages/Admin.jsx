import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../api/admin'
import UserManagement from './UserManagement'
import SystemSettings from './SystemSettings'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import {
  DollarSign, ShoppingCart, Users, Package, AlertTriangle,
  TrendingUp, TrendingDown, FileText
} from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const statusColor = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'delivered' || s === 'completed') return 'bg-green-100 text-green-800'
  if (s === 'shipped' || s === 'processing') return 'bg-blue-100 text-blue-800'
  if (s === 'pending') return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard().then(res => res.data),
  })

  const kpis = [
    {
      title: 'Revenue (30d)',
      value: `$${dashboard?.kpis?.total_revenue_30d?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Orders (30d)',
      value: dashboard?.kpis?.order_count_30d || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Expenses (30d)',
      value: `$${dashboard?.kpis?.total_expenses_30d?.toLocaleString() || 0}`,
      icon: TrendingDown,
      color: 'bg-orange-500',
    },
    {
      title: 'Net Profit (30d)',
      value: `$${dashboard?.kpis?.net_profit_30d?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
    },
    {
      title: 'Profit Margin',
      value: `${(dashboard?.kpis?.profit_margin || 0).toFixed(2)}%`,
      icon: FileText,
      color: 'bg-teal-500',
    },
    {
      title: 'Employees',
      value: dashboard?.kpis?.active_employees || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Low Stock Items',
      value: dashboard?.kpis?.low_stock_items || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Inventory Value',
      value: `$${dashboard?.kpis?.total_inventory_value?.toLocaleString() || 0}`,
      icon: Package,
      color: 'bg-gray-600',
    },
  ]

  const expensesData = dashboard?.finance?.expenses_by_type
    ? Object.entries(dashboard.finance.expenses_by_type).map(([name, value]) => ({ name, value }))
    : []

  const ordersByStatus = dashboard?.sales?.orders_by_status
    ? Object.entries(dashboard.sales.orders_by_status).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex flex-wrap gap-4 sm:gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Settings
          </button>
        </nav>
      </div>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'settings' && <SystemSettings />}
      {activeTab === 'dashboard' && (
        isLoading ? <p>Loading dashboard...</p> :
        <div>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.title} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{kpi.title}</p>
                      <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                    </div>
                    <div className={`${kpi.color} p-3 rounded-full`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Daily Revenue (7d)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboard?.sales?.daily_revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Best Selling Products</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard?.sales?.best_selling_products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Expenses by Type</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard?.sales?.category_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboard?.recent_orders?.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(order.status)}`}>
                          {(order.status || '').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold mb-4">Low Stock Products</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboard?.inventory?.low_stock_products?.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.stock_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.min_stock_level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.category || 'N/A'}</td>
                    </tr>
                  ))}
                  {(!dashboard?.inventory?.low_stock_products || dashboard.inventory.low_stock_products.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No low stock items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

