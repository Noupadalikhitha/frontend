import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../api/admin'
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react'

export default function UserManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminAPI.getUsers().then(res => res.data),
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminAPI.getRoles().then(res => res.data),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => adminAPI.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleId }) => adminAPI.updateUserRole(id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setEditingUser(null)
    },
  })

  const createUserMutation = useMutation({
    mutationFn: (data) => adminAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowCreateModal(false)
    },
  })

  const handleCreateUser = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      full_name: formData.get('full_name'),
      role_id: parseInt(formData.get('role_id')),
    }
    createUserMutation.mutate(data)
  }

  const handleUpdateRole = (userId, roleId) => {
    updateRoleMutation.mutate({ id: userId, roleId })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex justify-center bg-blue-600 text-white px-4 py-2 rounded-lg items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role_id}
                    onChange={(e) => handleUpdateRole(user.id, parseInt(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {roles?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => activateMutation.mutate(user.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this user?')) {
                          deleteMutation.mutate(user.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role_id"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    {roles?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
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

