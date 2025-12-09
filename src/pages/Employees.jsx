import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeAPI } from '../api/employee'
import { useSelector } from 'react-redux'
import { Plus, Edit, Trash2, Eye, Clock, DollarSign, TrendingUp, FileText, AlertTriangle, BookOpen, BarChart3 } from 'lucide-react'

export default function Employees() {
  const [showModal, setShowModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showTimesheetModal, setShowTimesheetModal] = useState(null)
  const [showSalaryModal, setShowSalaryModal] = useState(null)
  const [showPerformanceModal, setShowPerformanceModal] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('employees') // 'employees', 'attendance', 'salary', 'performance', 'ai'
  const queryClient = useQueryClient()
  const user = useSelector((state) => state.auth.user)
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Manager'

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeAPI.getEmployees().then(res => res.data),
  })

  const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => employeeAPI.getAttendance().then(res => res.data),
    enabled: activeTab === 'attendance',
    retry: 1
  })

  // AI Features Queries
  const { data: performanceAnomalies } = useQuery({
    queryKey: ['performance-anomalies'],
    queryFn: () => employeeAPI.getPerformanceAnomalies().then(res => res.data),
    enabled: activeTab === 'ai'
  })

  const { data: hrReport } = useQuery({
    queryKey: ['hr-report'],
    queryFn: () => employeeAPI.generateHRReport().then(res => res.data),
    enabled: activeTab === 'ai'
  })

  const { data: trainingRecommendations } = useQuery({
    queryKey: ['training-recommendations'],
    queryFn: () => employeeAPI.getTrainingRecommendations().then(res => res.data),
    enabled: activeTab === 'ai'
  })

  const createMutation = useMutation({
    mutationFn: (data) => employeeAPI.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees'])
      setShowModal(false)
      setEditingEmployee(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeAPI.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees'])
      setShowModal(false)
      setEditingEmployee(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => employeeAPI.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees'])
    },
  })

  const attendanceMutation = useMutation({
    mutationFn: (data) => employeeAPI.createAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      setShowAttendanceModal(false)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      employee_id: formData.get('employee_id'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      position: formData.get('position'),
      department: formData.get('department'),
      hire_date: formData.get('hire_date'),
      salary: formData.get('salary') ? parseFloat(formData.get('salary')) : null,
    }

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleAttendanceSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Format datetime strings properly
    let check_in = formData.get('check_in')
    let check_out = formData.get('check_out')
    
    // Convert datetime-local to ISO format if provided
    if (check_in) {
      check_in = new Date(check_in).toISOString()
    }
    if (check_out) {
      check_out = new Date(check_out).toISOString()
    }
    
    const data = {
      employee_id: parseInt(formData.get('employee_id')),
      date: formData.get('date'),
      status: formData.get('status'),
      check_in: check_in || null,
      check_out: check_out || null,
      notes: formData.get('notes') || null,
    }

    attendanceMutation.mutate(data)
  }

  const handleDelete = (employeeId) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      deleteMutation.mutate(employeeId)
    }
  }

  const handleGenerateTimesheet = async (employee) => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    
    try {
      const response = await employeeAPI.getTimesheet(employee.id, year, month)
      setShowTimesheetModal(response.data)
    } catch (error) {
      console.error('Failed to generate timesheet:', error)
      alert(`Failed to generate timesheet: ${error.response?.data?.detail || error.message}`)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        {isAdminOrManager && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="inline-flex justify-center bg-green-600 text-white px-4 py-2 rounded-lg items-center gap-2 hover:bg-green-700"
            >
              <Clock className="w-4 h-4" />
              Add Attendance
            </button>
            <button
              onClick={() => {
                setEditingEmployee(null)
                setShowModal(true)
              }}
              className="inline-flex justify-center bg-blue-600 text-white px-4 py-2 rounded-lg items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attendance
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

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                  {isAdminOrManager && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees?.map((employee) => (
                  <tr key={employee.id} className={!employee.is_active ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{employee.employee_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdminOrManager && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGenerateTimesheet(employee)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Generate Timesheet"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(employee)
                              setShowModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
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
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div>
          {isAdminOrManager && (
            <div className="mb-4">
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <Clock className="w-4 h-4" />
                Add Attendance
              </button>
            </div>
          )}
          {attendanceError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error loading attendance: {attendanceError.message}
            </div>
          )}
          {attendanceLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p>Loading attendance records...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {attendance && attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hours Worked</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{record.employee_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.hours_worked ? `${record.hours_worked.toFixed(2)} hrs` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No attendance records found</p>
                {isAdminOrManager && (
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Add First Attendance Record
                  </button>
                )}
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* Employee Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID</label>
                    <input
                      type="text"
                      name="employee_id"
                      defaultValue={editingEmployee?.employee_id}
                      disabled={!!editingEmployee}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hire Date</label>
                    <input
                      type="date"
                      name="hire_date"
                      defaultValue={editingEmployee?.hire_date}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      defaultValue={editingEmployee?.first_name}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      defaultValue={editingEmployee?.last_name}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingEmployee?.email}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingEmployee?.phone}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <input
                      type="text"
                      name="position"
                      defaultValue={editingEmployee?.position}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      defaultValue={editingEmployee?.department}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salary"
                    defaultValue={editingEmployee?.salary}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="border-t p-6 bg-gray-50 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingEmployee(null)
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

      {/* Attendance Form Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Add Attendance</h2>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <select name="employee_id" className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
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
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Check In</label>
                  <input
                    type="datetime-local"
                    name="check_in"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Check Out</label>
                  <input
                    type="datetime-local"
                    name="check_out"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea name="notes" rows="2" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timesheet Modal */}
      {showTimesheetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  Timesheet - {showTimesheetModal.employee_name}
                </h2>
                <button onClick={() => setShowTimesheetModal(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(showTimesheetModal.year, showTimesheetModal.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-2xl font-bold">{showTimesheetModal.total_days}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold">{showTimesheetModal.present_days}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold">{showTimesheetModal.absent_days}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold">{showTimesheetModal.total_hours_worked.toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Check In</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Check Out</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showTimesheetModal.attendance_records?.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          {record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          {record.hours_worked ? `${record.hours_worked.toFixed(2)} hrs` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Performance Anomalies */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold">Performance Anomalies & Attendance Issues</h3>
              </div>
            </div>
            <div className="p-6">
              {performanceAnomalies ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Flagged Employees</p>
                      <p className="text-2xl font-bold text-red-600">{performanceAnomalies.summary?.anomaly_count}</p>
                      <p className="text-xs text-gray-600 mt-2">{performanceAnomalies.summary?.anomaly_percentage?.toFixed(1)}% of workforce</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Critical Cases</p>
                      <p className="text-2xl font-bold text-orange-600">{performanceAnomalies.summary?.critical_count}</p>
                      <p className="text-xs text-gray-600 mt-2">Need immediate attention</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Total Employees</p>
                      <p className="text-2xl font-bold text-yellow-600">{performanceAnomalies.summary?.total_employees}</p>
                      <p className="text-xs text-gray-600 mt-2">Analyzed</p>
                    </div>
                  </div>

                  {/* Anomalies List */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Flagged Employees</h4>
                    <div className="space-y-2">
                      {performanceAnomalies.summary?.anomalies?.slice(0, 12).map((emp) => (
                        <div key={emp.employee_id} className={`p-3 rounded-lg border-l-4 ${emp.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{emp.name}</p>
                              <p className="text-xs text-gray-600">{emp.position} • {emp.department}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${emp.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                              {emp.severity}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <p className="text-gray-600">Attendance: {emp.attendance_rate}%</p>
                              <p className="text-gray-600">{emp.absent_days} absences, {emp.late_days} late</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Performance: {emp.avg_performance_rating ? emp.avg_performance_rating + '/5' : 'N/A'}</p>
                              <p className="text-gray-600">Trend: {emp.performance_trend}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 mb-1"><strong>Issues:</strong> {emp.anomaly_reasons.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">AI Analysis & Recommendations</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{performanceAnomalies.ai_analysis}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading performance analysis...</p>
              )}
            </div>
          </div>

          {/* HR Report */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">HR Report & Workforce Analytics</h3>
              </div>
            </div>
            <div className="p-6">
              {hrReport ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-600">{hrReport.metrics?.total_active_employees}</p>
                      <p className="text-xs text-gray-600 mt-2">Active workforce</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Total Payroll</p>
                      <p className="text-2xl font-bold text-cyan-600">${(hrReport.metrics?.total_payroll / 1000000)?.toFixed(2)}M</p>
                      <p className="text-xs text-gray-600 mt-2">Annual commitment</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Departments</p>
                      <p className="text-2xl font-bold text-teal-600">{hrReport.metrics?.departments?.length}</p>
                      <p className="text-xs text-gray-600 mt-2">Across organization</p>
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Department Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hrReport.metrics?.departments?.map((dept, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-gray-900">{dept.name}</p>
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-semibold">{dept.count}</span>
                          </div>
                          <p className="text-xs text-gray-600">Avg Salary: ${(dept.avg_salary / 1000)?.toFixed(0)}k</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Avg Performance</p>
                      <p className="text-xl font-bold text-green-600">{hrReport.metrics?.avg_performance_rating?.toFixed(2)}/5</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Attendance (30d)</p>
                      <p className="text-lg font-bold text-blue-600">{((hrReport.metrics?.attendance_last_30_days?.present / (hrReport.metrics?.attendance_last_30_days?.present + hrReport.metrics?.attendance_last_30_days?.absent + hrReport.metrics?.attendance_last_30_days?.late)) * 100)?.toFixed(0)}%</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Performance Reviews</p>
                      <p className="text-xl font-bold text-purple-600">{hrReport.metrics?.recent_reviews}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Turnover (1y)</p>
                      <p className="text-xl font-bold text-red-600">{hrReport.metrics?.turnover_last_year}</p>
                    </div>
                  </div>

                  {/* Full Report */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Full HR Report</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{hrReport.report_content}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading HR report...</p>
              )}
            </div>
          </div>

          {/* Training Recommendations */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-semibold">Training & Development Recommendations</h3>
              </div>
            </div>
            <div className="p-6">
              {trainingRecommendations ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Low Performers</p>
                      <p className="text-2xl font-bold text-purple-600">{trainingRecommendations.summary?.total_low_performers}</p>
                      <p className="text-xs text-gray-600 mt-2">{trainingRecommendations.summary?.low_performer_percentage?.toFixed(1)}% of workforce</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">High Potential</p>
                      <p className="text-2xl font-bold text-indigo-600">{trainingRecommendations.summary?.high_potential}</p>
                      <p className="text-xs text-gray-600 mt-2">Ready to improve</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Active Workforce</p>
                      <p className="text-2xl font-bold text-pink-600">{trainingRecommendations.summary?.total_active_employees}</p>
                      <p className="text-xs text-gray-600 mt-2">Total employees</p>
                    </div>
                  </div>

                  {/* Development Candidates */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Development Priority List</h4>
                    <div className="space-y-2">
                      {trainingRecommendations.summary?.candidates?.slice(0, 10).map((candidate) => (
                        <div key={candidate.employee_id} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{candidate.name}</p>
                              <p className="text-xs text-gray-600">{candidate.position} • {candidate.department}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${candidate.improvement_potential === 'high' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                              {candidate.improvement_potential} potential
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div className="bg-white rounded p-1">
                              <p className="text-gray-600">Rating: {candidate.avg_rating}/5</p>
                            </div>
                            <div className="bg-white rounded p-1">
                              <p className="text-gray-600">Goals: {candidate.goals_completion}%</p>
                            </div>
                            <div className="bg-white rounded p-1">
                              <p className="text-gray-600">Reviews: {candidate.review_count}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">AI Training Recommendations</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{trainingRecommendations.recommendations}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading training recommendations...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
