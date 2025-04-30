// src/components/settings/BinanceTestnetOrderTest.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order, OrderSide, OrderType } from '@/types/exchange';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import { ConnectionStatusIndicator } from '@/components/connection/ConnectionStatusIndicator';
import { useFeatureFlags } from '@/config/featureFlags';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Component for testing order placement on Binance Testnet
 */
export function BinanceTestnetOrderTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Order form state
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [quantity, setQuantity] = useState<string>('0.001');
  const [price, setPrice] = useState<string>('30000');
  const [stopPrice, setStopPrice] = useState<string>('');

  // Feature flags
  const featureFlags = useFeatureFlags();

  // Get API keys
  const { hasKeys, loading: loadingKeys } = useApiKeys('binance_testnet');

  // Get connection status
  const { getStatus, checkConnection } = useConnectionStatus();

  // Debug function to check exchange info
  const handleCheckExchangeInfo = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      // Force refresh the exchange info by clearing the cache
      // This is a hack to access the private field - in a real app, you'd add a public method
      (adapter as any).cachedExchangeInfo = null;

      // Get exchange info
      const exchangeInfo = await adapter.getExchangeInfo();
      console.log('Exchange info:', exchangeInfo);

      // Log the adapter instance for debugging
      console.log('Adapter instance:', adapter);

      // Check if BTC/USDT symbol exists in the exchange info
      const btcusdt = exchangeInfo.symbols.find((s) => s.symbol === 'BTCUSDT');
      console.log('BTCUSDT symbol info:', btcusdt);

      // Log all available symbols
      const availableSymbols = exchangeInfo.symbols.map((s) => s.symbol);
      console.log('Available symbols:', availableSymbols);

      if (btcusdt) {
        setSuccess(
          `Symbol BTCUSDT found in exchange info. Available trading pairs: ${availableSymbols.slice(0, 5).join(', ')}... (${availableSymbols.length} total)`,
        );
      } else {
        setError(
          `Symbol BTCUSDT not found in exchange info. Available symbols: ${availableSymbols.slice(0, 5).join(', ')}... (${availableSymbols.length} total)`,
        );
      }
    } catch (err) {
      console.error('Error checking exchange info:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to check exchange info',
      );
    } finally {
      setLoading(false);
    }
  };

  // Place an order
  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPlacedOrder(null);

    // Check if Binance Testnet is enabled
    if (!featureFlags.useBinanceTestnet) {
      setError(
        'Binance Testnet is currently disabled. Please enable it in the settings first.',
      );
      setLoading(false);
      return;
    }

    try {
      // Validate inputs
      if (!symbol) {
        throw new Error('Symbol is required');
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
        throw new Error('Price is required for non-market orders');
      }

      if (
        (orderType === 'stop_limit' || orderType === 'stop_market') &&
        (!stopPrice || parseFloat(stopPrice) <= 0)
      ) {
        throw new Error('Stop price is required for stop orders');
      }

      console.log('Getting Binance Testnet adapter...');
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      // Force refresh the exchange info cache before placing the order
      // This ensures we have the latest trading rules
      console.log('Forcing refresh of exchange info cache...');
      (adapter as any).cachedExchangeInfo = null;

      // Prepare order
      const orderParams: Partial<Order> = {
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
      };

      // Add price for non-market orders
      if (orderType !== 'market') {
        orderParams.price = parseFloat(price);
      }

      // Add stop price for stop orders
      if (orderType === 'stop_limit' || orderType === 'stop_market') {
        orderParams.stopPrice = parseFloat(stopPrice);
      }

      console.log('Placing order with params:', orderParams);

      // Check if we have API keys
      if (!hasKeys) {
        console.warn('No API keys found, order will likely use mock data');
      }

      // Place order
      const order = await adapter.placeOrder('default', orderParams);
      console.log('Order placed successfully:', order);

      // Save the order to localStorage for the OrdersTable component to find
      try {
        const currentOrders = JSON.parse(
          localStorage.getItem('omnitrade_mock_orders') || '[]',
        );

        // Check if the order is already in localStorage
        const orderExists = currentOrders.some((o: any) => o.id === order.id);
        if (!orderExists) {
          // Format the order to match what the OrdersTable component expects
          const formattedOrder = {
            ...order,
            // Add required fields for OrdersTable
            userId: 'current-user',
            filledQuantity: order.executed || 0,
            // Ensure dates are in the correct format
            createdAt: order.timestamp
              ? new Date(order.timestamp).toISOString()
              : new Date().toISOString(),
            updatedAt: order.lastUpdated
              ? new Date(order.lastUpdated).toISOString()
              : new Date().toISOString(),
          };

          // Remove fields that might cause confusion
          delete formattedOrder.executed;
          delete formattedOrder.remaining;
          delete formattedOrder.timestamp;
          delete formattedOrder.lastUpdated;

          currentOrders.push(formattedOrder);
          localStorage.setItem(
            'omnitrade_mock_orders',
            JSON.stringify(currentOrders),
          );
          console.log(
            'Order saved to localStorage with correct format:',
            formattedOrder,
          );
        }
      } catch (storageError) {
        console.warn('Failed to save order to localStorage:', storageError);
      }

      // Set success message
      setSuccess(`Order placed successfully! Order ID: ${order.id}`);
      setPlacedOrder(order);

      // Refresh open orders
      await handleGetOpenOrders();

      // Update connection status
      await checkConnection('binance_testnet');
    } catch (err) {
      console.error('Error placing order:', err);

      // Provide more detailed error message
      let errorMessage =
        err instanceof Error ? err.message : 'Failed to place order';

      // Add suggestions for common errors
      if (
        errorMessage.includes('API-key') ||
        errorMessage.includes('signature')
      ) {
        errorMessage += '. Please check your API keys in the API Keys tab.';
      } else if (errorMessage.includes('Invalid symbol')) {
        errorMessage +=
          '. The trading pair may not be supported on Binance Testnet.';
      } else if (errorMessage.includes('Insufficient balance')) {
        errorMessage +=
          '. Make sure you have enough funds in your Binance Testnet account.';
      } else if (errorMessage.includes('404')) {
        errorMessage +=
          '. The Binance Testnet API endpoint may be unavailable. The system will fall back to mock data.';
      }

      setError(errorMessage);

      // Update connection status
      await checkConnection('binance_testnet');
    } finally {
      setLoading(false);
    }
  };

  // Get open orders
  const handleGetOpenOrders = async () => {
    setLoading(true);
    setError(null);

    // Check if Binance Testnet is enabled
    if (!featureFlags.useBinanceTestnet) {
      setError(
        'Binance Testnet is currently disabled. Please enable it in the settings first.',
      );
      setLoading(false);
      return;
    }

    try {
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      // Get open orders
      const orders = await adapter.getOpenOrders('default', symbol);
      console.log('Open orders:', orders);
      setOpenOrders(orders);

      // Update connection status
      await checkConnection('binance_testnet');
    } catch (err) {
      console.error('Error getting open orders:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to get open orders',
      );

      // Update connection status
      await checkConnection('binance_testnet');
    } finally {
      setLoading(false);
    }
  };

  // Get order history
  const handleGetOrderHistory = async () => {
    setLoading(true);
    setError(null);

    // Check if Binance Testnet is enabled
    if (!featureFlags.useBinanceTestnet) {
      setError(
        'Binance Testnet is currently disabled. Please enable it in the settings first.',
      );
      setLoading(false);
      return;
    }

    try {
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      // Get order history
      const orders = await adapter.getOrderHistory('default', symbol, 20);
      console.log('Order history:', orders);
      setOrderHistory(orders);

      // Update connection status
      await checkConnection('binance_testnet');
    } catch (err) {
      console.error('Error getting order history:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to get order history',
      );

      // Update connection status
      await checkConnection('binance_testnet');
    } finally {
      setLoading(false);
    }
  };

  // Cancel an order
  const handleCancelOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Check if Binance Testnet is enabled
    if (!featureFlags.useBinanceTestnet) {
      setError(
        'Binance Testnet is currently disabled. Please enable it in the settings first.',
      );
      setLoading(false);
      return;
    }

    try {
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      // Cancel order
      const result = await adapter.cancelOrder('default', orderId, symbol);
      console.log('Cancel order result:', result);

      if (result) {
        setSuccess(`Order ${orderId} canceled successfully!`);
        // Refresh open orders
        await handleGetOpenOrders();
      } else {
        setError(`Failed to cancel order ${orderId}`);
      }

      // Update connection status
      await checkConnection('binance_testnet');
    } catch (err) {
      console.error('Error canceling order:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');

      // Update connection status
      await checkConnection('binance_testnet');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Order Placement</CardTitle>
            <CardDescription>
              Place test orders on Binance Testnet
            </CardDescription>
          </div>
          <ConnectionStatusIndicator exchangeId="binance_testnet" size="md" />
        </div>
      </CardHeader>
      <CardContent>
        {!hasKeys && !loadingKeys && (
          <Alert className="mb-4 border-yellow-500">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>No API Keys Found</AlertTitle>
            <AlertDescription>
              You don't have any Binance Testnet API keys configured. Order
              placement will fail without valid API keys.
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById('api-keys-tab')?.click()
                  }
                >
                  Configure API Keys
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert
            variant="default"
            className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="place-order" className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="place-order">Place Order</TabsTrigger>
            <TabsTrigger value="open-orders">Open Orders</TabsTrigger>
            <TabsTrigger value="order-history">Order History</TabsTrigger>
          </TabsList>

          {/* Place Order Tab */}
          <TabsContent value="place-order" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger id="symbol">
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                    <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                    <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                    <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                    <SelectItem value="XRP/USDT">XRP/USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="side">Side</Label>
                <Select
                  value={side}
                  onValueChange={(value) => setSide(value as OrderSide)}
                >
                  <SelectTrigger id="side">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order-type">Order Type</Label>
                <Select
                  value={orderType}
                  onValueChange={(value) => setOrderType(value as OrderType)}
                >
                  <SelectTrigger id="order-type">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop_limit">Stop Limit</SelectItem>
                    <SelectItem value="stop_market">Stop Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                />
              </div>

              {orderType !== 'market' && (
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="30000"
                  />
                </div>
              )}

              {(orderType === 'stop_limit' || orderType === 'stop_market') && (
                <div>
                  <Label htmlFor="stop-price">Stop Price</Label>
                  <Input
                    id="stop-price"
                    type="number"
                    step="0.01"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="29000"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleCheckExchangeInfo}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Check Exchange Info
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>

            {placedOrder && (
              <div className="mt-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-2">Order Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID:</p>
                    <p className="font-medium">{placedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Symbol:</p>
                    <p className="font-medium">{placedOrder.symbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Side:</p>
                    <p className="font-medium capitalize">{placedOrder.side}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type:</p>
                    <p className="font-medium capitalize">
                      {placedOrder.type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status:</p>
                    <p className="font-medium capitalize">
                      {placedOrder.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity:</p>
                    <p className="font-medium">{placedOrder.quantity}</p>
                  </div>
                  {placedOrder.price && (
                    <div>
                      <p className="text-sm text-muted-foreground">Price:</p>
                      <p className="font-medium">{placedOrder.price}</p>
                    </div>
                  )}
                  {placedOrder.stopPrice && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Stop Price:
                      </p>
                      <p className="font-medium">{placedOrder.stopPrice}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Executed:</p>
                    <p className="font-medium">{placedOrder.executed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining:</p>
                    <p className="font-medium">{placedOrder.remaining}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp:</p>
                    <p className="font-medium">
                      {formatDate(placedOrder.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Open Orders Tab */}
          <TabsContent value="open-orders" className="mt-4">
            <div className="mb-4">
              <Button
                onClick={handleGetOpenOrders}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Refresh Open Orders'}
              </Button>
            </div>

            {openOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order ID</th>
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Side</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Quantity</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-2">{order.id}</td>
                        <td className="p-2">{order.symbol}</td>
                        <td className="p-2 capitalize">
                          {order.type.replace('_', ' ')}
                        </td>
                        <td className="p-2 capitalize">{order.side}</td>
                        <td className="p-2">{order.price}</td>
                        <td className="p-2">{order.quantity}</td>
                        <td className="p-2 capitalize">
                          {order.status.replace('_', ' ')}
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No open orders found.</p>
            )}
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="order-history" className="mt-4">
            <div className="mb-4">
              <Button
                onClick={handleGetOrderHistory}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Refresh Order History'}
              </Button>
            </div>

            {orderHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order ID</th>
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Side</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Quantity</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderHistory.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-2">{order.id}</td>
                        <td className="p-2">{order.symbol}</td>
                        <td className="p-2 capitalize">
                          {order.type.replace('_', ' ')}
                        </td>
                        <td className="p-2 capitalize">{order.side}</td>
                        <td className="p-2">{order.price}</td>
                        <td className="p-2">{order.quantity}</td>
                        <td className="p-2 capitalize">
                          {order.status.replace('_', ' ')}
                        </td>
                        <td className="p-2">{formatDate(order.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No order history found.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Note: This is a test environment. No real funds will be used.
        </p>
      </CardFooter>
    </Card>
  );
}
