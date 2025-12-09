import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { financeAPI } from '../api/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const AIFinance = () => {
  const { data: forecastData, isLoading: isForecastLoading, error: forecastError } = useQuery({
    queryKey: ['finance-forecasts'],
    queryFn: () => financeAPI.getForecasts().then(res => res.data),
  });

  const { data: abnormalExpenses, isLoading: isAbnormalLoading, error: abnormalError } = useQuery({
    queryKey: ['finance-abnormal-expenses'],
    queryFn: () => financeAPI.getAbnormalExpenses().then(res => res.data),
  });

  const { mutate: generateReport, isLoading: isGeneratingReport, data: reportData } = useMutation({
    mutationFn: () => financeAPI.generateReport().then(res => res.data),
  });

  const handleGenerateReport = () => {
    generateReport();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Financial Insights</h1>
      
      {/* Revenue and Cash Flow Forecasts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Revenue & Cash Flow Forecasts</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {isForecastLoading && <p>Loading forecasts...</p>}
          {forecastError && <p className="text-red-500">Error loading forecasts: {forecastError.message}</p>}
          {forecastData && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[...forecastData.revenue_forecast, ...forecastData.cash_flow_forecast]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Revenue" />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Cash Flow" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Abnormal Expense Detection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Abnormal Expense Detection</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {isAbnormalLoading && <p>Detecting abnormal expenses...</p>}
          {abnormalError && <p className="text-red-500">Error detecting abnormal expenses: {abnormalError.message}</p>}
          {abnormalExpenses && (
            <ul className="divide-y divide-gray-200">
              {abnormalExpenses.map(expense => (
                <li key={expense.id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{expense.description || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-500">${expense.amount.toFixed(2)}</p>
                      <p className="text-sm text-yellow-600">{expense.reason}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Financial Summaries and Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Financial Summaries & Reports</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>Generate audit-ready financial summaries and PDF reports.</p>
          <button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 disabled:bg-blue-300"
          >
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <div className="mt-4">
              <p className="font-semibold">Report generated successfully!</p>
              <a href={reportData.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Download {reportData.file_name}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIFinance;
