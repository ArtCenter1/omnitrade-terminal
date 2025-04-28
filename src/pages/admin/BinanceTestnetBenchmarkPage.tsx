// src/pages/admin/BinanceTestnetBenchmarkPage.tsx
import React from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import BinanceTestnetBenchmark from '@/components/admin/BinanceTestnetBenchmark';

export default function BinanceTestnetBenchmarkPage() {
  return (
    <ProtectedLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Binance Testnet Benchmarking</h1>
            <p className="text-gray-400 text-sm mt-1">
              Measure performance and latency of Binance Testnet API endpoints
            </p>
          </div>
          <Link
            to="/admin/analytics"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics Dashboard
          </Link>
        </div>

        <BinanceTestnetBenchmark />
      </div>
    </ProtectedLayout>
  );
}
