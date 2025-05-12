// src/pages/admin/AnalyticsDashboard.tsx
import React from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, TrendingUp, LineChart } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function AnalyticsDashboard() {
  return (
    <ProtectedLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Monitor system performance and analyze metrics
            </p>
          </div>
          <BackButton to="/admin" label="Back to Admin Dashboard" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-purple-500">
            <h3 className="text-sm text-gray-400">Total API Requests</h3>
            <p className="text-2xl font-bold mt-1">12,458</p>
            <p className="text-xs text-green-400 mt-1">↑ 8% from last week</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-sm text-gray-400">Average Response Time</h3>
            <p className="text-2xl font-bold mt-1">245ms</p>
            <p className="text-xs text-red-400 mt-1">↑ 12ms from last week</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="text-sm text-gray-400">Success Rate</h3>
            <p className="text-2xl font-bold mt-1">99.8%</p>
            <p className="text-xs text-green-400 mt-1">↑ 0.2% from last week</p>
          </div>
        </div>

        <h2 className="text-xl font-medium mb-4">Analytics Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/analytics/binance-benchmark"
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 mr-2 text-yellow-500" />
              <h3 className="font-medium">Binance Testnet Benchmark</h3>
            </div>
            <p className="text-sm text-gray-400">
              Measure performance and latency of Binance Testnet API
            </p>
          </Link>

          {/* Placeholder for future analytics tools */}
          <div className="bg-gray-800 p-4 rounded-lg opacity-50">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="font-medium">User Activity Analytics</h3>
            </div>
            <p className="text-sm text-gray-400">
              Track user engagement and activity patterns
            </p>
            <div className="mt-2 text-xs bg-gray-700 inline-block px-2 py-1 rounded">
              Coming Soon
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg opacity-50">
            <div className="flex items-center mb-2">
              <LineChart className="h-5 w-5 mr-2 text-green-500" />
              <h3 className="font-medium">System Health Monitor</h3>
            </div>
            <p className="text-sm text-gray-400">
              Monitor system resources and performance
            </p>
            <div className="mt-2 text-xs bg-gray-700 inline-block px-2 py-1 rounded">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
