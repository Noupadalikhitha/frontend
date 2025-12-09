import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiAPI } from '../api/ai'
import { Send, RefreshCw, Database } from 'lucide-react'

export default function AIChat() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])

  const queryMutation = useMutation({
    mutationFn: (q) => aiAPI.query(q),
    onSuccess: (res) => {
      const data = res.data
      setMessages((prev) => [
        ...prev,
        { type: 'user', content: query },
        {
          type: 'assistant',
          content: data.summary || 'Here are the results.',
          sql: data.sql_query,
          results: data.results || [],
        },
      ])
      setQuery('')
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        { type: 'user', content: query },
        { type: 'assistant', content: err.response?.data?.summary || 'Something went wrong.' },
      ])
      setQuery('')
    },
  })

  const quickPrompts = [
    'Show low-stock products',
    'Which employee worked the most last week?',
    'What was my revenue this month?',
    'Show expenses by type for last 30 days',
    'Forecast sales for next 30 days',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    queryMutation.mutate(query)
  }

  const handleQuickPrompt = (prompt) => {
    setQuery(prompt)
    queryMutation.mutate(prompt)
  }

  const renderResultsTable = (rows) => {
    if (!rows || rows.length === 0) return null
    const columns = Object.keys(rows[0])
    return (
      <div className="mt-3 border rounded bg-white text-gray-800">
        <div className="overflow-auto max-h-64">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-2 py-1 text-left font-semibold text-gray-700 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-t">
                  {columns.map((col) => (
                    <td key={col} className="px-2 py-1 whitespace-nowrap">
                      {row[col]?.toString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 20 && (
          <div className="px-3 py-2 text-[11px] text-gray-500">Showing first 20 of {rows.length} rows</div>
        )}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <div className="flex gap-2 flex-wrap">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleQuickPrompt(p)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
              disabled={queryMutation.isLoading}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>Ask me anything about your business data!</p>
              <p className="text-sm mt-2">Try: "Show me low stock products" or "What's the revenue for last 30 days?"</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sql && (
                  <div className="mt-3 text-xs bg-white text-gray-800 rounded border border-gray-200 p-2">
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
                      <Database className="w-3 h-3" />
                      Generated SQL
                    </div>
                    <pre className="overflow-auto">{msg.sql}</pre>
                  </div>
                )}
                {msg.results && msg.results.length > 0 && renderResultsTable(msg.results)}
              </div>
            </div>
          ))}
          {queryMutation.isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <p>Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your business data..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={queryMutation.isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}



