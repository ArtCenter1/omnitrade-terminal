import React, { useState, useMemo } from 'react';
import { AssetRow } from '@/components/AssetRow';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Asset } from '@/lib/utils';

// Define the sort fields and directions
type SortField = 'asset' | 'amount' | 'value' | 'price' | 'change';
type SortDirection = 'asc' | 'desc';

interface PortfolioTableProps {
  assets: any[];
  isLoading: boolean;
  error: Error | null;
}

export function PortfolioTable({
  assets,
  isLoading,
  error,
}: PortfolioTableProps) {
  // Add sorting state
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending for value, ascending for others
      setSortField(field);
      setSortDirection(field === 'value' ? 'desc' : 'asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp className="inline-block ml-1 w-4 h-4" />
    ) : (
      <ChevronDown className="inline-block ml-1 w-4 h-4" />
    );
  };

  // Sort assets
  const sortedAssets = useMemo(() => {
    if (!assets || assets.length === 0) return [];

    return [...assets].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'asset':
          aValue = a.symbol?.toLowerCase() || '';
          bValue = b.symbol?.toLowerCase() || '';
          break;
        case 'amount':
          aValue =
            typeof a.amount === 'number'
              ? a.amount
              : parseFloat(a.amount || '0');
          bValue =
            typeof b.amount === 'number'
              ? b.amount
              : parseFloat(b.amount || '0');
          break;
        case 'value':
          aValue =
            typeof a.value === 'number'
              ? a.value
              : parseFloat((a.value || '0').replace(/[^0-9.-]+/g, ''));
          bValue =
            typeof b.value === 'number'
              ? b.value
              : parseFloat((b.value || '0').replace(/[^0-9.-]+/g, ''));
          break;
        case 'price':
          aValue =
            typeof a.price === 'number'
              ? a.price
              : parseFloat((a.price || '0').replace(/[^0-9.-]+/g, ''));
          bValue =
            typeof b.price === 'number'
              ? b.price
              : parseFloat((b.price || '0').replace(/[^0-9.-]+/g, ''));
          break;
        case 'change':
          // Extract numeric value from change string (e.g., "+1.5%" -> 1.5)
          const aChangeStr =
            typeof a.change === 'string'
              ? a.change
              : a.change?.toString() || '0';
          const bChangeStr =
            typeof b.change === 'string'
              ? b.change
              : b.change?.toString() || '0';
          aValue = parseFloat(aChangeStr.replace(/[^0-9.-]+/g, ''));
          bValue = parseFloat(bChangeStr.replace(/[^0-9.-]+/g, ''));
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      // Handle NaN values
      if (isNaN(aValue)) aValue = 0;
      if (isNaN(bValue)) bValue = 0;

      // Sort based on direction
      return sortDirection === 'asc'
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
          ? 1
          : -1;
    });
  }, [assets, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-400">
        Loading portfolio data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Error loading portfolio data</p>
        <p className="text-gray-400">{error.toString()}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th
              className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('asset')}
            >
              Asset {renderSortIndicator('asset')}
            </th>
            <th
              className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('amount')}
            >
              Amount {renderSortIndicator('amount')}
            </th>
            <th
              className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('value')}
            >
              Value (USD) {renderSortIndicator('value')}
            </th>
            <th
              className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('price')}
            >
              Last Price {renderSortIndicator('price')}
            </th>
            <th
              className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('change')}
            >
              24h Change {renderSortIndicator('change')}
            </th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
              7d Chart
            </th>
            <th className="text-center py-2 px-2 text-sm font-medium text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAssets.length > 0 ? (
            sortedAssets.map((asset, index) => (
              <AssetRow key={`${asset.symbol}-${index}`} asset={asset} />
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-400">
                No assets found. Connect an exchange to see your portfolio.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
