import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '../api/inventory'
import { Plus, Edit, Trash2, TrendingDown, AlertTriangle, Zap } from 'lucide-react'

export default function Inventory() {
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => inventoryAPI.getProducts().then(res => res.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => inventoryAPI.getCategories().then(res => res.data),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => inventoryAPI.getSuppliers().then(res => res.data),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryAPI.getLowStock().then(res => res.data),
  })

  // AI Features Queries
  const { data: shortagePredictions } = useQuery({
    queryKey: ['stock-shortage-predictions'],
    queryFn: () => inventoryAPI.getStockShortagePredictions(30).then(res => res.data),
  })

  const { data: reorderRecommendations } = useQuery({
    queryKey: ['reorder-recommendations'],
    queryFn: () => inventoryAPI.getReorderRecommendations().then(res => res.data),
  })

  const { data: inventorySummary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => inventoryAPI.getInventorySummary().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => inventoryAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setShowModal(false)
      setEditingProduct(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['low-stock'])
    },
  })

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(productId)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    const processedData = {
      ...data,
      price: parseFloat(data.price),
      cost: data.cost ? parseFloat(data.cost) : null,
      stock_quantity: parseInt(data.stock_quantity),
      min_stock_level: parseInt(data.min_stock_level || 10),
      category_id: parseInt(data.category_id),
      supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
    }
    
    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        data: processedData
      })
    } else {
      createMutation.mutate(processedData)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex justify-center bg-blue-600 text-white px-4 py-2 rounded-lg items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Low Stock Alert</h3>
          <p className="text-yellow-700">{lowStock.length} products are running low on stock</p>
        </div>
      )}

      {/* AI Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stock Shortage Predictions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              <h3 className="font-semibold">Stock Shortage Alerts</h3>
            </div>
          </div>
          <div className="p-4">
            {shortagePredictions?.critical_items > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold text-red-600">{shortagePredictions.critical_items}</span> products critically low
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {shortagePredictions?.predictions?.slice(0, 5).map((pred) => (
                    <div key={pred.product_id} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                      <p className="font-medium text-gray-900">{pred.product_name}</p>
                      <p className="text-gray-600">Stock: {pred.current_stock} (Min: {pred.min_stock_level})</p>
                      <p className="text-red-600 text-xs mt-1">⏰ By {pred.predicted_stock_out_date}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-green-600 text-sm">✓ All products well-stocked</p>
            )}
          </div>
        </div>

        {/* Reorder Recommendations */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold">Reorder Suggestions</h3>
            </div>
          </div>
          <div className="p-4">
            {reorderRecommendations?.total_recommendations > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold text-blue-600">{reorderRecommendations.urgent_items}</span> urgent orders needed
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Est. Cost: <span className="font-semibold">${reorderRecommendations.total_estimated_reorder_cost?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reorderRecommendations?.recommendations?.slice(0, 5).map((rec) => (
                    <div key={rec.product_id} className="text-xs p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="font-medium text-gray-900">{rec.product_name}</p>
                      <p className="text-gray-600">Order: {rec.recommended_quantity} units</p>
                      <p className="text-blue-600 text-xs mt-1">💰 ${(rec.recommended_quantity * rec.estimated_cost / rec.recommended_quantity).toFixed(2)} each</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-green-600 text-sm">✓ No reorders needed at this time</p>
            )}
          </div>
        </div>

        {/* AI Inventory Summary */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Monthly Summary</h3>
            </div>
          </div>
          <div className="p-4">
            {inventorySummary ? (
              <>
                <div className="text-xs text-gray-600 space-y-2 mb-3">
                  <p><span className="font-semibold">{inventorySummary.statistics?.total_active_products}</span> products tracked</p>
                  <p><span className="font-semibold">${inventorySummary.statistics?.total_inventory_value?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span> total value</p>
                  <p><span className="font-semibold text-red-600">{inventorySummary.statistics?.low_stock_items}</span> below minimum</p>
                </div>
                <div className="bg-purple-50 rounded p-2 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-700 leading-relaxed">{inventorySummary.ai_summary?.substring(0, 200)}...</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Loading summary...</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product) => (
              <tr key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono">{product.sku}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm">{product.category_name || 'N/A'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm">{product.supplier_name || 'No Supplier'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={product.stock_quantity <= product.min_stock_level ? 'text-red-600 font-semibold' : ''}>
                      {product.stock_quantity}
                    </span>
                    <span className="text-xs text-gray-500">Min: {product.min_stock_level}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium">${product.price?.toFixed(2)}</div>
                    {product.cost && (
                      <div className="text-xs text-gray-500">Cost: ${product.cost.toFixed(2)}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product)
                        setShowModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={editingProduct?.sku}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingProduct?.description}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category_id"
                    defaultValue={editingProduct?.category_id}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select
                    name="supplier_id"
                    defaultValue={editingProduct?.supplier_id || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">No Supplier</option>
                    {suppliers?.map((sup) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={editingProduct?.price}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost"
                    defaultValue={editingProduct?.cost}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    defaultValue={editingProduct?.stock_quantity}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Stock Level</label>
                  <input
                    type="number"
                    name="min_stock_level"
                    defaultValue={editingProduct?.min_stock_level || 10}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="border-t p-6 bg-gray-50 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {createMutation.isLoading || updateMutation.isLoading 
                    ? 'Processing...' 
                    : editingProduct ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingProduct(null)
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
    </div>
  )
}


