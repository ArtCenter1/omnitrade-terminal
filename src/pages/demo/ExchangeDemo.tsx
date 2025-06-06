import React from 'react';
import ExchangeAdapterExample from '@/components/examples/ExchangeAdapterExample';

export default function ExchangeDemo() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Exchange Adapter Demo</h1>

      <div className="mb-6 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">About This Demo</h2>
        <p className="text-gray-300 mb-4">
          This page demonstrates the mock data and exchange adapter system that
          has been implemented as part of the frontend-backend integration work.
          It allows you to:
        </p>
        <ul className="list-disc pl-6 text-gray-300 space-y-1">
          <li>
            Switch between different connection modes (mock, sandbox, live)
          </li>
          <li>Select different exchanges (Binance, Coinbase)</li>
          <li>View trading pairs for the selected exchange</li>
          <li>View order books for selected trading pairs</li>
          <li>Load a mock portfolio</li>
        </ul>
        <p className="text-gray-300 mt-4">
          All data shown is mock data generated by the system. In production,
          this would connect to real exchanges.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <ExchangeAdapterExample />
      </div>
    </div>
  );
}
