import { useQuery } from '@tanstack/react-query'
import { authAPI } from '../api/auth'
import { inventoryAPI } from '../api/inventory'
import { salesAPI } from '../api/sales'
import { employeeAPI } from '../api/employee'
import { financeAPI } from '../api/finance'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertCircle, Wallet, Zap } from 'lucide-react'

export default function Dashboard() {
  // Try to fetch admin dashboard first (comprehensive data), fall back to regular dashboard
  const { data: adminDashboardData } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        if (response.ok) {
          return response.json()
        }
        return null
      } catch (error) {
        return null
      }
    },
    retry: false,
  })

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => authAPI.getDashboard(),
    retry: false,
  })

  // Use admin data if available, otherwise fallback to regular dashboard
  const data = adminDashboardData || dashboardData

  // Colors for pie charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const kpis = data?.kpis ? [
    {
      title: 'Revenue (30d)',
      value: `$${(data.kpis.total_revenue_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-green-500',
      subtext: `Margin: ${(data.kpis.profit_margin || 0).toFixed(1)}%`
    },
    {
      title: 'Orders (30d)',
      value: data.kpis.order_count_30d || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      subtext: 'Total orders'
    },
    {
      title: 'Employees',
      value: data.kpis.active_employees || 0,
      icon: Users,
      color: 'bg-purple-500',
      subtext: 'Active staff'
    },
    {
      title: 'Low Stock Items',
      value: data.kpis.low_stock_items || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      subtext: 'Need reorder'
    },
    ...(data.kpis.net_profit_30d !== undefined ? [{
      title: 'Net Profit (30d)',
      value: `$${(data.kpis.net_profit_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      subtext: 'Bottom line'
    }] : []),
    ...(data.kpis.total_expenses_30d !== undefined ? [{
      title: 'Total Expenses (30d)',
      value: `$${(data.kpis.total_expenses_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'bg-orange-500',
      subtext: 'All costs'
    }] : []),
    ...(data.kpis.total_inventory_value !== undefined ? [{
      title: 'Inventory Value',
      value: `$${(data.kpis.total_inventory_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Package,
      color: 'bg-indigo-500',
      subtext: 'Total stock value'
    }] : []),
    ...(data.kpis.total_products !== undefined ? [{
      title: 'Total Products',
      value: data.kpis.total_products || 0,
      icon: Zap,
      color: 'bg-cyan-500',
      subtext: 'Active SKUs'
    }] : []),
  ] : []

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Last 30 days analytics</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.title} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-2 text-gray-800">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{kpi.subtext}</p>
                </div>
                <div className={`${kpi.color} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue Trend */}
        {data?.sales?.daily_revenue_trend && data.sales.daily_revenue_trend.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Daily Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.sales.daily_revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Orders by Status */}
        {data?.sales?.orders_by_status && Object.keys(data.sales.orders_by_status).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(data.sales.orders_by_status).map(([status, count]) => ({
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(data.sales.orders_by_status).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} orders`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Best Selling Products */}
        {data?.sales?.best_selling_products && data.sales.best_selling_products.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Best Selling Products</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.sales.best_selling_products.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Performance */}
        {data?.sales?.category_performance && data.sales.category_performance.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Category Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={data.sales.category_performance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="category" 
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={140}
                />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expenses by Type */}
        {data?.finance?.expenses_by_type && Object.keys(data.finance.expenses_by_type).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Expenses by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(data.finance.expenses_by_type).map(([type, amount]) => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: parseFloat(amount)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(data.finance.expenses_by_type).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Financial Summary */}
        {data?.kpis && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Financial Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${(data.kpis.total_revenue_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-green-500">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    ${(data.kpis.total_expenses_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold mt-1 ${(data.kpis.net_profit_30d || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${(data.kpis.net_profit_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-600">{(data.kpis.profit_margin || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Alerts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        {data?.inventory?.low_stock_products && data.inventory.low_stock_products.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Low Stock Alert</h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {data.inventory.low_stock_products.length} items
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.inventory.low_stock_products.map((product) => (
                <div key={product.id} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{product.stock_quantity} left</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((product.stock_quantity / product.min_stock_level) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">Min: {product.min_stock_level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {data?.recent_orders && data.recent_orders.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Orders</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recent_orders.map((order) => (
                <div key={order.id} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">${order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded mt-1 inline-block ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


