import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import {
  getOrders,
  cancelOrder,
  Order,
  getMockOrders,
} from '../../services/enhancedOrdersService';
import { Loader2, X, RefreshCw } from 'lucide-react';
import { useFeatureFlags } from '@/config/featureFlags';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';

interface OrdersTableProps {
  selectedSymbol?: string;
  refreshTrigger?: number;
  initialTab?: 'open' | 'history';
  showTabs?: boolean;
}

export function OrdersTable({
  selectedSymbol,
  refreshTrigger = 0,
  initialTab = 'open',
  showTabs = true,
}: OrdersTableProps) {
  console.log('OrdersTable refreshTrigger:', refreshTrigger);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { selectedAccount } = useSelectedAccount();

  // Update activeTab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch orders when component mounts, account changes, or refresh is triggered
  useEffect(() => {
    console.log('OrdersTable useEffect triggered:', {
      selectedAccount,
      activeTab,
      selectedSymbol,
      refreshTrigger,
    });

    // Always fetch orders, even if selectedAccount is null
    // This ensures we clear the orders list when no account is selected
    fetchOrders();

    // Set up a timer to refresh orders periodically
    const intervalId = setInterval(() => {
      console.log('Periodic refresh of orders');
      fetchOrders();
    }, 5000); // Refresh every 5 seconds

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedAccount, activeTab, selectedSymbol, refreshTrigger]);

  // Fetch orders from the API
  const fetchOrders = async () => {
    console.log(
      'OrdersTable fetchOrders called with refreshTrigger:',
      refreshTrigger,
    );
    setIsLoading(true);
    try {
      // For open orders tab, get new and partially filled orders
      // For history tab, get all orders (undefined status)
      const status = activeTab === 'open' ? 'new,partially_filled' : undefined;

      console.log('Fetching orders with params:', {
        exchange: selectedAccount?.exchange,
        symbol: selectedSymbol,
        status,
        activeTab,
      });

      // Even if there's no selected account, we'll try to get mock orders
      // This allows us to show orders that were created before an account was selected
      const exchangeId =
        selectedAccount?.exchangeId || selectedAccount?.exchange || 'binance'; // Default to binance if no account selected
      console.log(`Using exchange ID: ${exchangeId} for fetching orders`);

      // Try to get orders from the API first
      let apiOrders: Order[] = [];
      try {
        apiOrders = await getOrders(exchangeId, selectedSymbol, status);
        console.log(`API Orders received (${apiOrders.length}):`, apiOrders);
      } catch (apiError) {
        console.warn(
          'Error fetching orders from API, will try localStorage:',
          apiError,
        );
      }

      // Also get orders from localStorage as a fallback or supplement
      let localOrders: Order[] = [];
      try {
        const storedOrders = localStorage.getItem('omnitrade_mock_orders');
        if (storedOrders) {
          console.log('Raw stored orders from localStorage:', storedOrders);
          const parsedOrders = JSON.parse(storedOrders);
          console.log('Parsed orders from localStorage:', parsedOrders);

          // Filter orders based on the same criteria
          localOrders = parsedOrders.filter((order: any) => {
            // Filter by exchange if needed - be more lenient with exchange ID matching
            if (
              exchangeId &&
              order.exchangeId !== exchangeId &&
              order.exchangeId !== 'binance_testnet' &&
              exchangeId !== 'binance_testnet'
            ) {
              console.log(
                `Filtering out order ${order.id} due to exchange mismatch: ${order.exchangeId} vs ${exchangeId}`,
              );
              return false;
            }

            // Filter by symbol if needed
            if (selectedSymbol && order.symbol !== selectedSymbol) {
              console.log(
                `Filtering out order ${order.id} due to symbol mismatch: ${order.symbol} vs ${selectedSymbol}`,
              );
              return false;
            }

            // Filter by status if needed
            if (status) {
              const statusList = status.split(',');
              if (!statusList.includes(order.status)) {
                console.log(
                  `Filtering out order ${order.id} due to status mismatch: ${order.status} not in ${statusList}`,
                );
                return false;
              }
            } else if (activeTab === 'history') {
              // For history tab, show all except new and partially_filled
              if (
                order.status === 'new' ||
                order.status === 'partially_filled'
              ) {
                console.log(
                  `Filtering out order ${order.id} from history tab due to status: ${order.status}`,
                );
                return false;
              }
            } else if (activeTab === 'open') {
              // For open tab, only show new and partially_filled
              if (
                order.status !== 'new' &&
                order.status !== 'partially_filled'
              ) {
                console.log(
                  `Filtering out order ${order.id} from open tab due to status: ${order.status}`,
                );
                return false;
              }
            }

            return true;
          });

          console.log(
            `localStorage Orders filtered (${localOrders.length}):`,
            localOrders,
          );
        }
      } catch (localError) {
        console.error('Error getting orders from localStorage:', localError);
      }

      // Combine orders from both sources, removing duplicates
      const combinedOrders = [...apiOrders];

      // Add local orders that aren't already in the API orders
      localOrders.forEach((localOrder: any) => {
        if (!combinedOrders.some((apiOrder) => apiOrder.id === localOrder.id)) {
          combinedOrders.push(localOrder);
        }
      });

      console.log(
        `Combined orders (${combinedOrders.length}):`,
        combinedOrders,
      );

      // Sort orders by creation date (newest first)
      const sortedOrders = [...combinedOrders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      console.log('Sorted orders:', sortedOrders);
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Failed to fetch orders',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      // Set empty orders array on error
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string, symbol?: string) => {
    setIsCancelling((prev) => ({ ...prev, [orderId]: true }));
    try {
      // Find the order to get the symbol if not provided
      const order = orders.find((o) => o.id === orderId);
      const orderSymbol = symbol || order?.symbol;

      if (!orderSymbol) {
        throw new Error('Symbol not found for order');
      }

      // Get the exchange ID from the selected account
      const exchangeId = selectedAccount?.isSandbox
        ? 'sandbox' // This will be converted to binance_testnet if needed
        : selectedAccount?.exchange || 'binance';

      console.log(
        `Canceling order ${orderId} on ${exchangeId} for ${orderSymbol}`,
      );

      // Check if this is a mock order (starts with "mock_")
      const isMockOrder = orderId.startsWith('mock_');
      console.log(
        `Canceling ${isMockOrder ? 'mock' : 'real'} order: ${orderId}`,
      );

      let result = false;

      // For mock orders, we'll handle them directly in localStorage
      if (isMockOrder) {
        console.log('Handling mock order cancellation via localStorage');
        try {
          const storedOrders = localStorage.getItem('omnitrade_mock_orders');
          if (storedOrders) {
            const parsedOrders = JSON.parse(storedOrders);
            const orderExists = parsedOrders.some(
              (order: any) => order.id === orderId,
            );

            if (!orderExists) {
              throw new Error(`Order ${orderId} not found in localStorage`);
            }

            // Update the order status in localStorage
            const updatedOrders = parsedOrders.map((order: any) => {
              if (order.id === orderId) {
                return {
                  ...order,
                  status: 'canceled',
                  updatedAt: new Date().toISOString(),
                };
              }
              return order;
            });

            // Save back to localStorage
            localStorage.setItem(
              'omnitrade_mock_orders',
              JSON.stringify(updatedOrders),
            );
            console.log(
              'Updated order in localStorage:',
              updatedOrders.find((o: any) => o.id === orderId),
            );
            result = true;
          } else {
            throw new Error('No orders found in localStorage');
          }
        } catch (localError) {
          console.error('Error updating order in localStorage:', localError);
          throw localError;
        }
      } else {
        // For real orders, use the cancelOrder function
        result = await cancelOrder(orderId, exchangeId, orderSymbol);
      }

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

        // Refresh orders to ensure we have the latest data
        setTimeout(() => {
          fetchOrders();
        }, 500);
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
    <div
      className={
        showTabs ? 'bg-[#1a1a1c] border border-gray-800 rounded-md' : ''
      }
    >
      <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab}>
        {showTabs && (
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
        )}

        <TabsContent value="open" className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
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
                        onClick={() =>
                          handleCancelOrder(order.id, order.symbol)
                        }
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
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
              <p>Loading order history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
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
