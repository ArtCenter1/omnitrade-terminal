import { Button } from "@/components/ui/button";
import { AssetChart } from "./AssetChart";
import { generateChartData } from "@/lib/utils";

type AssetRowProps = {
  asset: {
    icon: string;
    name: string;
    symbol: string;
    amount: string;
    value: string;
    price: string;
    change: string;
  };
};

export function AssetRow({ asset }: AssetRowProps) {
  const isPositive = !asset.change.includes("-");
  const chartData = generateChartData(isPositive);

  return (
    <tr className="border-b border-gray-800">
      <td className="py-4 px-4 flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full overflow-hidden">
          <img
            src={asset.icon || "/placeholder.svg"}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="font-medium text-white">{asset.name}</div>
          <div className="text-xs text-gray-400">{asset.symbol}</div>
        </div>
      </td>
      <td className="py-4 px-4 text-gray-300">{asset.amount}</td>
      <td className="py-4 px-4 text-gray-300">{asset.value}</td>
      <td className="py-4 px-4 text-gray-300">{asset.price}</td>
      <td className="py-4 px-4">
        <span
          className={`text-sm ${isPositive ? "text-crypto-green" : "text-crypto-red"}`}
        >
          {asset.change}
        </span>
      </td>
      <td className="py-4 px-4">
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
