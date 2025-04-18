import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { getOrders, cancelOrder, Order } from '../../services/ordersService';
import { Loader2, X } from 'lucide-react';

interface OrdersTableProps {
  selectedSymbol?: string;
  refreshTrigger?: number;
}

export function OrdersTable({
  selectedSymbol,
  refreshTrigger = 0,
}: OrdersTableProps) {
  const [activeTab, setActiveTab] = useState('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { selectedAccount } = useSelectedAccount();

  // Fetch orders when component mounts, account changes, or refresh is triggered
  useEffect(() => {
    if (selectedAccount) {
      fetchOrders();
    }
  }, [selectedAccount, activeTab, selectedSymbol, refreshTrigger]);

  // Fetch orders from the API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const status = activeTab === 'open' ? 'new,partially_filled' : undefined;
      const orders = await getOrders(
        selectedAccount?.exchange,
        selectedSymbol,
        status,
      );

      // Sort orders by creation date (newest first)
      const sortedOrders = [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Failed to fetch orders',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    setIsCancelling((prev) => ({ ...prev, [orderId]: true }));
    try {
      const result = await cancelOrder(orderId);
      if (result) {
        toast({
          title: 'Order cancelled',
          description: `Order ${orderId.substring(0, 8)}... has been cancelled.`,
          variant: 'default',
        });

        // Update the order in the list
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: 'canceled' } : order,
          ),
        );
      } else {
        throw new Error('Failed to cancel order');
      }
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      toast({
        title: 'Failed to cancel order',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Format date to a readable string
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format price with appropriate decimal places
  const formatPrice = (price?: number) => {
    if (price === undefined) return 'Market';
    return price.toFixed(2);
  };

  return (
    <div className="bg-[#1a1a1c] border border-gray-800 rounded-md">
      <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-gray-900 border-b border-gray-800 rounded-none">
          <TabsTrigger
            value="open"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
          >
            Open Orders
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
          >
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-400">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
              <p>No open orders</p>
              {selectedSymbol && (
                <p className="text-sm mt-2">for {selectedSymbol}</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-xs text-gray-400">
                  <th className="text-left py-2 px-4 font-medium">Date</th>
                  <th className="text-left py-2 px-4 font-medium">Pair</th>
                  <th className="text-left py-2 px-4 font-medium">Type</th>
                  <th className="text-left py-2 px-4 font-medium">Side</th>
                  <th className="text-right py-2 px-4 font-medium">Price</th>
                  <th className="text-right py-2 px-4 font-medium">Amount</th>
                  <th className="text-right py-2 px-4 font-medium">Filled</th>
                  <th className="text-right py-2 px-4 font-medium">Status</th>
                  <th className="text-right py-2 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800">
                    <td className="py-2 px-4 text-sm text-gray-300">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2 px-4 text-sm text-white">
                      {order.symbol}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-300">
                      {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      <span
                        className={
                          order.side === 'buy'
                            ? 'text-crypto-green'
                            : 'text-crypto-red'
                        }
                      >
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-right text-gray-300">
                      {formatPrice(order.price)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right text-gray-300">
                      {order.quantity.toFixed(8)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right text-gray-300">
                      {order.filledQuantity.toFixed(8)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-800 text-gray-300">
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={isCancelling[order.id]}
                        className="h-8 w-8 p-0"
                      >
                        {isCancelling[order.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>

        <TabsContent value="history" className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-400">
                Loading order history...
              </span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
              <p>No order history</p>
              {selectedSymbol && (
                <p className="text-sm mt-2">for {selectedSymbol}</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-xs text-gray-400">
                  <th className="text-left py-2 px-4 font-medium">Date</th>
                  <th className="text-left py-2 px-4 font-medium">Pair</th>
                  <th className="text-left py-2 px-4 font-medium">Type</th>
                  <th className="text-left py-2 px-4 font-medium">Side</th>
                  <th className="text-right py-2 px-4 font-medium">Price</th>
                  <th className="text-right py-2 px-4 font-medium">Amount</th>
                  <th className="text-right py-2 px-4 font-medium">Filled</th>
                  <th className="text-right py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800">
                    <td className="py-2 px-4 text-sm text-gray-300">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2 px-4 text-sm text-white">
                      {order.symbol}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-300">
                      {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      <span
                        className={
                          order.side === 'buy'
                            ? 'text-crypto-green'
                            : 'text-crypto-red'
                        }
                      >
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-right text-gray-300">
                      {order.avgFillPrice
                        ? order.avgFillPrice.toFixed(2)
                        : formatPrice(order.price)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right text-gray-300">
                      {order.quantity.toFixed(8)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right text-gray-300">
                      {order.filledQuantity.toFixed(8)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'filled'
                            ? 'bg-crypto-green/20 text-crypto-green'
                            : order.status === 'canceled'
                              ? 'bg-gray-800 text-gray-300'
                              : order.status === 'rejected'
                                ? 'bg-crypto-red/20 text-crypto-red'
                                : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
