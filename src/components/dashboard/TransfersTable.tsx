import React from 'react';

export function TransfersTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Date
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Asset
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Type
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Amount
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Status
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              Transaction ID
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={6} className="text-center py-8 text-gray-400">
              No transfer history found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
