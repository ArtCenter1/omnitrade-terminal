import React from 'react';

interface DashboardOrdersTableProps {
  type: 'open' | 'history';
}

export function DashboardOrdersTable({ type }: DashboardOrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Date
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Pair
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Type
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Side
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Price
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Amount
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Filled
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Total
            </th>
            {type === 'open' && (
              <th className="text-center py-2 px-2 text-sm font-medium text-gray-400">
                Actions
              </th>
            )}
            {type === 'history' && (
              <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                Status
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={type === 'open' ? 9 : 9}
              className="text-center py-8 text-gray-400"
            >
              No {type === 'open' ? 'open orders' : 'order history'} found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
