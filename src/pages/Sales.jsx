import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '../api/sales'
import { inventoryAPI } from '../api/inventory'
import { Plus, Edit, Eye, DollarSign, TrendingUp, Package, Calendar, TrendingDown, Star, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function Sales() {
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showOrderDetail, setShowOrderDetail] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'reports', 'dashboard', 'ai'
  const [reportType, setReportType] = useState('daily') // 'daily', 'weekly', 'monthly'
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => salesAPI.getOrders().then(res => res.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => salesAPI.getCustomers().then(res => res.data),
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => inventoryAPI.getProducts().then(res => res.data),
  })

  const { data: analytics } = useQuery({
    queryKey: ['sales-analytics', 30],
    queryFn: () => salesAPI.getAnalytics(30).then(res => res.data),
  })

  const { data: dailyReport } = useQuery({
    queryKey: ['daily-report', new Date().toISOString().split('T')[0]],
    queryFn: () => salesAPI.getDailyReport(new Date().toISOString().split('T')[0]).then(res => res.data),
    enabled: activeTab === 'reports' && reportType === 'daily'
  })

  const { data: weeklyReport } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: () => salesAPI.getWeeklyReport().then(res => res.data),
    enabled: activeTab === 'reports' && reportType === 'weekly'
  })

  const { data: monthlyReport } = useQuery({
    queryKey: ['monthly-report'],
    queryFn: () => salesAPI.getMonthlyReport().then(res => res.data),
    enabled: activeTab === 'reports' && reportType === 'monthly'
  })

  // AI Features Queries
  const { data: salesTrends } = useQuery({
    queryKey: ['sales-trends'],
    queryFn: () => salesAPI.getSalesTrends(30).then(res => res.data),
    enabled: activeTab === 'ai'
  })

  const { data: bestSellers } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: () => salesAPI.getBestSellers().then(res => res.data),
    enabled: activeTab === 'ai'
  })

  const { data: underperformers } = useQuery({
    queryKey: ['underperformers'],
    queryFn: () => salesAPI.getUnderperformers().then(res => res.data),
    enabled: activeTab === 'ai'
  })

  const createOrderMutation = useMutation({
    mutationFn: (data) => salesAPI.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['sales-analytics'])
      setShowOrderModal(false)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => salesAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['sales-analytics'])
    },
  })

  const createPaymentMutation = useMutation({
    mutationFn: (data) => salesAPI.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      setShowPaymentModal(null)
    },
  })

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus })
  }

  const handleCreateOrder = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const customerId = parseInt(formData.get('customer_id'))
    const items = []
    
    // Get items from form
    const itemCount = parseInt(formData.get('item_count') || '1')
    for (let i = 0; i < itemCount; i++) {
      const productId = formData.get(`item_${i}_product_id`)
      const quantity = formData.get(`item_${i}_quantity`)
      const unitPrice = formData.get(`item_${i}_unit_price`)
      
      if (productId && quantity && unitPrice) {
        items.push({
          product_id: parseInt(productId),
          quantity: parseInt(quantity),
          unit_price: parseFloat(unitPrice)
        })
      }
    }

    createOrderMutation.mutate({
      customer_id: customerId,
      items,
      discount: parseFloat(formData.get('discount') || 0),
      tax: parseFloat(formData.get('tax') || 0),
      notes: formData.get('notes')
    })
  }

  const handleCreatePayment = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createPaymentMutation.mutate({
      order_id: showPaymentModal.id,
      amount: parseFloat(formData.get('amount')),
      payment_method: formData.get('payment_method'),
      transaction_id: formData.get('transaction_id'),
      notes: formData.get('notes')
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold">Sales & Orders</h1>
        <button
          onClick={() => setShowOrderModal(true)}
          className="inline-flex justify-center bg-blue-600 text-white px-4 py-2 rounded-lg items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex flex-wrap gap-4 sm:gap-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            AI Insights
          </button>
        </nav>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders?.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)} border-0`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">${order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                        {order.total_paid > 0 && (
                          <span className="text-xs text-gray-500 mt-1">
                            Paid: ${order.total_paid.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowOrderDetail(order)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.payment_status !== 'paid' && (
                          <button
                            onClick={() => setShowPaymentModal(order)}
                            className="text-green-600 hover:text-green-800"
                            title="Add Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && analytics && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                  <p className="text-2xl font-bold">${analytics.total_sales.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Orders</p>
                  <p className="text-2xl font-bold">{analytics.order_count}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    ${analytics.order_count > 0 ? (analytics.total_sales / analytics.order_count).toFixed(2) : '0.00'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Pending Orders</p>
                  <p className="text-2xl font-bold">{analytics.status_breakdown?.pending || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Revenue Trend (Last 7 Days)</h2>
              {analytics.daily_trend && analytics.daily_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
              {analytics.status_breakdown ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.status_breakdown).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analytics.status_breakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Best Selling Products */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Best Selling Products</h2>
              {analytics.best_selling_products && analytics.best_selling_products.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.best_selling_products.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Category Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
              {analytics.category_performance && analytics.category_performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.category_performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4">
              <button
                onClick={() => setReportType('daily')}
                className={`px-4 py-2 rounded-lg ${reportType === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setReportType('weekly')}
                className={`px-4 py-2 rounded-lg ${reportType === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg ${reportType === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {reportType === 'daily' && dailyReport && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Daily Sales Report - {new Date(dailyReport.date).toLocaleDateString()}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${dailyReport.total_revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Count</p>
                  <p className="text-2xl font-bold">{dailyReport.order_count}</p>
                </div>
              </div>
              {dailyReport.category_performance && dailyReport.category_performance.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyReport.category_performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {reportType === 'weekly' && weeklyReport && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">
                Weekly Sales Report - {new Date(weeklyReport.week_start).toLocaleDateString()} to {new Date(weeklyReport.week_end).toLocaleDateString()}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${weeklyReport.total_revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Count</p>
                  <p className="text-2xl font-bold">{weeklyReport.order_count}</p>
                </div>
              </div>
              {weeklyReport.daily_revenue && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Daily Revenue Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(weeklyReport.daily_revenue).map(([date, revenue]) => ({ date, revenue }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {reportType === 'monthly' && monthlyReport && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Monthly Sales Report - {monthlyReport.month_name} {monthlyReport.year}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${monthlyReport.total_revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Count</p>
                  <p className="text-2xl font-bold">{monthlyReport.order_count}</p>
                </div>
              </div>
              {monthlyReport.weekly_revenue && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Weekly Revenue Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(monthlyReport.weekly_revenue).map(([week, revenue]) => ({ week, revenue }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Order Details - {showOrderDetail.order_number}</h2>
                <button onClick={() => setShowOrderDetail(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">{showOrderDetail.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(showOrderDetail.status)}`}>
                  {showOrderDetail.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Items</p>
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showOrderDetail.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">{item.product_name}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">${item.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-2">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-lg">${showOrderDetail.total_amount.toFixed(2)}</span>
                </div>
                {showOrderDetail.total_paid > 0 && (
                  <div className="flex justify-between mt-2">
                    <span>Paid</span>
                    <span>${showOrderDetail.total_paid.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Add Payment</h2>
              <p className="text-sm text-gray-600 mt-1">Order: {showPaymentModal.order_number}</p>
              <p className="text-sm text-gray-600">Remaining: ${(showPaymentModal.total_amount - (showPaymentModal.total_paid || 0)).toFixed(2)}</p>
            </div>
            <form onSubmit={handleCreatePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  max={showPaymentModal.total_amount - (showPaymentModal.total_paid || 0)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select name="payment_method" className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID (Optional)</label>
                <input type="text" name="transaction_id" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea name="notes" rows="2" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal - Simplified for now */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Create New Order</h2>
            </div>
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <select name="customer_id" className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="">Select Customer</option>
                  {customers?.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <select name="item_0_product_id" className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="">Select Product</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)} (Stock: {product.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" name="item_0_quantity" min="1" className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Price</label>
                  <input type="number" step="0.01" name="item_0_unit_price" className="w-full px-4 py-2 border rounded-lg" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <input type="number" step="0.01" name="discount" defaultValue="0" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax</label>
                  <input type="number" step="0.01" name="tax" defaultValue="0" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea name="notes" rows="2" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <input type="hidden" name="item_count" value="1" />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Create Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Sales Trends Prediction */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-semibold">Sales Trends & Predictions</h3>
              </div>
            </div>
            <div className="p-6">
              {salesTrends ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Trend Direction</p>
                      <p className="text-2xl font-bold text-blue-600">{salesTrends.trend_analysis?.trend_direction}</p>
                      <p className="text-xs text-gray-600 mt-2">{salesTrends.trend_analysis?.trend_percentage?.toFixed(2)}% change</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Avg Daily Revenue</p>
                      <p className="text-2xl font-bold text-green-600">${salesTrends.trend_analysis?.average_daily_revenue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Forecast Period</p>
                      <p className="text-2xl font-bold text-purple-600">{salesTrends.days_ahead} days</p>
                      <p className="text-xs text-gray-600 mt-2">Prediction horizon</p>
                    </div>
                  </div>
                  
                  {/* Top Products */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Top Trending Products</h4>
                    <div className="space-y-2">
                      {salesTrends.trend_analysis?.top_products?.slice(0, 5).map((prod, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{prod.product}</span>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">{prod.quantity_sold} units</p>
                            <p className="text-xs text-gray-500">${prod.revenue?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Prediction */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">AI Prediction & Insights</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{salesTrends.ai_prediction}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading sales trends...</p>
              )}
            </div>
          </div>

          {/* Best Sellers Analysis */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <h3 className="font-semibold">Best-Selling Products & Categories</h3>
              </div>
            </div>
            <div className="p-6">
              {bestSellers ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Growth Rate</p>
                      <p className="text-2xl font-bold text-amber-600">{bestSellers.analysis?.growth_rate?.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600 mt-2">vs previous period</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Recent Revenue</p>
                      <p className="text-2xl font-bold text-orange-600">${bestSellers.analysis?.recent_period_revenue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-gray-600 mt-2">Last 60 days</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Top Products</p>
                      <p className="text-2xl font-bold text-yellow-600">{bestSellers.analysis?.top_products?.length}</p>
                      <p className="text-xs text-gray-600 mt-2">Tracked in analysis</p>
                    </div>
                  </div>

                  {/* Top Products Table */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Top 10 Products by Revenue</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Product</th>
                            <th className="px-4 py-2 text-right font-semibold">Units Sold</th>
                            <th className="px-4 py-2 text-right font-semibold">Revenue</th>
                            <th className="px-4 py-2 text-right font-semibold">Avg Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestSellers.analysis?.top_products?.map((prod) => (
                            <tr key={prod.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2">{prod.name}</td>
                              <td className="px-4 py-2 text-right">{prod.quantity_sold}</td>
                              <td className="px-4 py-2 text-right font-semibold">${prod.revenue?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-2 text-right">${prod.avg_unit_price?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">AI Insights & Recommendations</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{bestSellers.ai_insights}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading best sellers analysis...</p>
              )}
            </div>
          </div>

          {/* Underperformers Analysis */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-semibold">Underperforming Items</h3>
              </div>
            </div>
            <div className="p-6">
              {underperformers ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Underperforming Items</p>
                      <p className="text-2xl font-bold text-red-600">{underperformers.metrics?.underperformers_count}</p>
                      <p className="text-xs text-gray-600 mt-2">{underperformers.metrics?.underperforming_percentage?.toFixed(1)}% of inventory</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Total Products</p>
                      <p className="text-2xl font-bold text-pink-600">{underperformers.metrics?.total_products}</p>
                      <p className="text-xs text-gray-600 mt-2">Tracked items</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Avg Revenue Target</p>
                      <p className="text-2xl font-bold text-orange-600">${(underperformers.metrics?.average_revenue_per_product / 1000)?.toFixed(1)}k</p>
                      <p className="text-xs text-gray-600 mt-2">Per product avg</p>
                    </div>
                  </div>

                  {/* Underperformers List */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Items Below Performance Threshold</h4>
                    <div className="space-y-2">
                      {underperformers.metrics?.underperformers?.slice(0, 10).map((item) => (
                        <div key={item.id} className="flex justify-between items-start p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {item.total_qty_sold} units sold • {item.sale_count} transactions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600">${item.total_revenue?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-500">${(item.revenue_vs_avg).toLocaleString('en-US', { maximumFractionDigits: 0 })} vs avg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">AI Recommendations & Action Plan</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{underperformers.ai_recommendations}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading underperformers analysis...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
