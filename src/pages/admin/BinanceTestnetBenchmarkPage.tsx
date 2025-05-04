// src/pages/admin/BinanceTestnetBenchmarkPage.tsx
import React from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { BarChart3 } from 'lucide-react';
import BinanceTestnetBenchmark from '@/components/admin/BinanceTestnetBenchmark';
import { BackButton } from '@/components/ui/back-button';

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
          <BackButton to="/admin/analytics" label="Back to Analytics Dashboard" />
        </div>

        <BinanceTestnetBenchmark />
      </div>
    </ProtectedLayout>
  );
}
