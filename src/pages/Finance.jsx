import AIFinance from './AIFinance';
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeAPI } from '../api/finance'
import { useSelector } from 'react-redux'
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, FileText, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function Finance() {
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'expenses', 'revenue', 'reports', 'ai'
  const [reportType, setReportType] = useState('month-end') // 'month-end', 'profit-loss'
  const queryClient = useQueryClient()
  const user = useSelector((state) => state.auth.user)
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Manager'

  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeAPI.getSummary().then(res => res.data),
  })

  const { data: dashboard } = useQuery({
    queryKey: ['finance-dashboard', 30],
    queryFn: () => financeAPI.getDashboard(30).then(res => res.data),
  })

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeAPI.getExpenses().then(res => res.data),
    enabled: activeTab === 'expenses'
  })

  const { data: revenue } = useQuery({
    queryKey: ['revenue'],
    queryFn: () => financeAPI.getRevenue().then(res => res.data),
    enabled: activeTab === 'revenue'
  })

  const { data: budgetCategories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: () => financeAPI.getBudgetCategories().then(res => res.data),
  })

  const { data: monthEndReport } = useQuery({
    queryKey: ['month-end-report'],
    queryFn: () => financeAPI.getMonthEndReport().then(res => res.data),
    enabled: activeTab === 'reports' && reportType === 'month-end'
  })

  const { data: profitLossReport } = useQuery({
    queryKey: ['profit-loss-report'],
    queryFn: () => financeAPI.getProfitLossReport().then(res => res.data),
    enabled: activeTab === 'reports' && reportType === 'profit-loss'
  })

  const createExpenseMutation = useMutation({
    mutationFn: (data) => financeAPI.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['finance-summary'])
      queryClient.invalidateQueries(['finance-dashboard'])
      setShowExpenseModal(false)
      setEditingExpense(null)
    },
  })

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => financeAPI.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['finance-summary'])
      queryClient.invalidateQueries(['finance-dashboard'])
      setShowExpenseModal(false)
      setEditingExpense(null)
    },
    onError: (error) => {
      console.error('Failed to update expense:', error)
      alert(`Failed to update expense: ${error.response?.data?.detail || error.message}`)
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => financeAPI.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['finance-summary'])
      queryClient.invalidateQueries(['finance-dashboard'])
    },
  })

  const createRevenueMutation = useMutation({
    mutationFn: (data) => financeAPI.createRevenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['revenue'])
      queryClient.invalidateQueries(['finance-summary'])
      queryClient.invalidateQueries(['finance-dashboard'])
      setShowRevenueModal(false)
    },
  })

  const handleExpenseSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const categoryIdValue = formData.get('category_id')
    const data = {
      category_id: categoryIdValue && categoryIdValue !== '' ? parseInt(categoryIdValue) : null,
      expense_type: formData.get('expense_type'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description') || null,
      vendor: formData.get('vendor') || null,
      date: formData.get('date'),
    }

    if (editingExpense) {
      // For update, send all fields (backend will use exclude_unset to only update provided fields)
      updateExpenseMutation.mutate({ id: editingExpense.id, data })
    } else {
      createExpenseMutation.mutate(data)
    }
  }

  const handleRevenueSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createRevenueMutation.mutate({
      source: formData.get('source'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description') || null,
      date: formData.get('date'),
    })
  }

  const handleDeleteExpense = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(expenseId)
    }
  }

  const getExpenseTypeColor = (type) => {
    const colors = {
      bills: 'bg-red-100 text-red-800',
      purchases: 'bg-blue-100 text-blue-800',
      payroll: 'bg-purple-100 text-purple-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || colors.other
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold">Finance</h1>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={() => setShowRevenueModal(true)}
            className="inline-flex justify-center bg-green-600 text-white px-4 py-2 rounded-lg items-center gap-2 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Revenue
          </button>
          <button
            onClick={() => {
              setEditingExpense(null)
              setShowExpenseModal(true)
            }}
            className="inline-flex justify-center bg-blue-600 text-white px-4 py-2 rounded-lg items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'revenue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Revenue
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

      {activeTab === 'ai' && <AIFinance />}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${summary?.total_revenue?.toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${summary?.total_expenses?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Net Profit</p>
                  <p className={`text-2xl font-bold ${(summary?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${summary?.net_profit?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${(summary?.net_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Profit Margin</p>
                  <p className="text-2xl font-bold">
                    {summary?.total_revenue > 0 
                      ? `${((summary?.net_profit || 0) / summary.total_revenue * 100).toFixed(2)}%`
                      : '0%'}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses by Category */}
            {dashboard?.expenses_by_category && dashboard.expenses_by_category.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard.expenses_by_category}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Expenses by Type */}
            {dashboard?.expenses_by_type && Object.keys(dashboard.expenses_by_type).length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Expenses by Type</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboard.expenses_by_type).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(dashboard.expenses_by_type).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Revenue Breakdown */}
            {dashboard && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Revenue Breakdown</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">From Orders</span>
                    <span className="font-semibold text-green-600">
                      ${(dashboard.revenue_from_orders || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">From Other Sources</span>
                    <span className="font-semibold text-green-600">
                      ${(dashboard.revenue_from_other || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Total Revenue</span>
                    <span className="font-bold text-lg text-green-600">
                      ${(dashboard.total_revenue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Amount</th>
                    {isAdminOrManager && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses?.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getExpenseTypeColor(expense.expense_type)}`}>
                          {expense.expense_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{expense.category_name || 'N/A'}</td>
                      <td className="px-6 py-4">{expense.description || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{expense.vendor || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">
                        ${expense.amount.toFixed(2)}
                      </td>
                      {isAdminOrManager && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingExpense(expense)
                                setShowExpenseModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenue?.map((rev) => (
                    <tr key={rev.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(rev.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {rev.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">{rev.description || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                        ${rev.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                onClick={() => setReportType('month-end')}
                className={`px-4 py-2 rounded-lg ${reportType === 'month-end' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Month-End Report
              </button>
              <button
                onClick={() => setReportType('profit-loss')}
                className={`px-4 py-2 rounded-lg ${reportType === 'profit-loss' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Profit & Loss
              </button>
            </div>
          </div>

          {/* Month-End Report */}
          {reportType === 'month-end' && monthEndReport && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">
                Month-End Report - {new Date(monthEndReport.year, monthEndReport.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${monthEndReport.total_revenue.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">${monthEndReport.total_expenses.toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-lg ${monthEndReport.net_profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${monthEndReport.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${monthEndReport.net_profit.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold">{monthEndReport.profit_margin.toFixed(2)}%</p>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Revenue Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg">
                    <p className="text-sm text-gray-600">From Orders</p>
                    <p className="text-xl font-bold text-green-600">${monthEndReport.revenue_from_orders.toLocaleString()}</p>
                  </div>
                  <div className="border p-4 rounded-lg">
                    <p className="text-sm text-gray-600">From Other Sources</p>
                    <p className="text-xl font-bold text-green-600">${monthEndReport.revenue_from_other.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Expenses by Type */}
              {monthEndReport.expenses_by_type && Object.keys(monthEndReport.expenses_by_type).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Expenses by Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(monthEndReport.expenses_by_type).map(([type, amount]) => (
                      <div key={type} className="border p-4 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize">{type}</p>
                        <p className="text-xl font-bold text-red-600">${amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses by Category Chart */}
              {monthEndReport.expenses_by_category && monthEndReport.expenses_by_category.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthEndReport.expenses_by_category}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Profit & Loss Report */}
          {reportType === 'profit-loss' && profitLossReport && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">
                Profit & Loss Report
              </h2>
              <p className="text-gray-600 mb-6">
                {new Date(profitLossReport.period_start).toLocaleDateString()} to {new Date(profitLossReport.period_end).toLocaleDateString()}
              </p>
              
              {/* P&L Statement */}
              <div className="space-y-4 mb-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3">Revenue</h3>
                  <div className="space-y-2 ml-4">
                    <div className="flex justify-between">
                      <span>Revenue from Orders</span>
                      <span className="font-medium">${profitLossReport.revenue_from_orders.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Revenue</span>
                      <span className="font-medium">${profitLossReport.revenue_from_other.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total Revenue</span>
                      <span className="text-green-600">${profitLossReport.total_revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                  <div className="space-y-2 ml-4">
                    {Object.entries(profitLossReport.expenses_by_type || {}).map(([type, amount]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <span className="font-medium text-red-600">${amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total Expenses</span>
                      <span className="text-red-600">${profitLossReport.total_expenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Profit / Loss</span>
                    <span className={`text-2xl font-bold ${profitLossReport.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profitLossReport.net_profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <span className="text-sm font-medium">{profitLossReport.profit_margin.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {profitLossReport.expenses_by_type && Object.keys(profitLossReport.expenses_by_type).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Expenses by Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(profitLossReport.expenses_by_type).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(profitLossReport.expenses_by_type).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {profitLossReport.expenses_by_category && profitLossReport.expenses_by_category.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Expenses by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={profitLossReport.expenses_by_category}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
            </div>
            <form onSubmit={handleExpenseSubmit} key={editingExpense?.id || 'new'} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expense Type</label>
                  <select
                    name="expense_type"
                    defaultValue={editingExpense?.expense_type || 'other'}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="bills">Bills</option>
                    <option value="purchases">Purchases</option>
                    <option value="payroll">Payroll</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category_id"
                    defaultValue={editingExpense?.category_id || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">No Category</option>
                    {budgetCategories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    defaultValue={editingExpense?.amount || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="2"
                    defaultValue={editingExpense?.description || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    defaultValue={editingExpense?.vendor || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="border-t p-6 bg-gray-50 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingExpense ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false)
                    setEditingExpense(null)
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Add Revenue</h2>
            </div>
            <form onSubmit={handleRevenueSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select name="source" className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="sales">Sales</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Add Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevenueModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
