import { Button } from '@/components/ui/button';
import { AssetChart } from './AssetChart';
import { Asset } from '@/lib/utils';
import { generateChartData } from '@/lib/utils';

// Define a type that can handle both the new Asset type and the legacy asset type
type AssetRowProps = {
  asset:
    | Asset
    | {
        icon?: string;
        name: string;
        symbol: string;
        amount: string;
        value: string;
        price: string;
        change: string;
      };
};

export function AssetRow({ asset }: AssetRowProps) {
  // Check if the asset is the new type (with numeric values) or the legacy type (with string values)
  const isNewAssetType = typeof asset.amount === 'number';

  // Determine if the change is positive
  const isPositive = isNewAssetType
    ? (asset as Asset).change >= 0
    : !asset.change.includes('-');

  // Get chart data - either from the asset or generate it
  const chartData = isNewAssetType
    ? (asset as Asset).chart || []
    : generateChartData(isPositive);

  return (
    <tr className="border-b border-gray-800">
      <td className="py-4 px-4 flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full overflow-hidden">
          <img
            src={
              isNewAssetType
                ? `/crypto-icons/${asset.symbol.toLowerCase()}.svg`
                : (asset as any).icon ||
                  `/crypto-icons/${asset.symbol.toLowerCase()}.svg`
            }
            alt={asset.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <div>
          <div className="font-medium text-white">{asset.name}</div>
          <div className="text-xs text-gray-400">{asset.symbol}</div>
        </div>
      </td>
      <td className="py-4 px-4 text-gray-300">
        {isNewAssetType ? (asset as Asset).amount.toFixed(8) : asset.amount}
      </td>
      <td className="py-4 px-4 text-gray-300">
        {isNewAssetType ? `$${(asset as Asset).value.toFixed(2)}` : asset.value}
      </td>
      <td className="py-4 px-4 text-gray-300">
        {isNewAssetType ? `$${(asset as Asset).price.toFixed(2)}` : asset.price}
      </td>
      <td className="py-4 px-4">
        <span
          className={`text-sm ${isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}
        >
          {isNewAssetType
            ? `${isPositive ? '+' : ''}${(asset as Asset).change.toFixed(2)}%`
            : asset.change}
        </span>
      </td>
      <td className="py-4 px-4 min-w-[120px] h-[50px]">
        <AssetChart data={chartData} isPositive={isPositive} />
      </td>
      <td className="py-4 px-4">
        <Button
          variant="outline"
          className="border-gray-600 hover:bg-gray-800 text-xs rounded"
        >
          TRADE
        </Button>
      </td>
    </tr>
  );
}
