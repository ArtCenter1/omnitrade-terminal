// src/components/settings/BinanceTestnetOrderTest.tsx
import { useState, useEffect } from 'react';
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
  const [quantity, setQuantity] = useState<string>('0.0004'); // Default quantity for BTC/USDT (above min)
  const [price, setPrice] = useState<string>('30000');
  const [stopPrice, setStopPrice] = useState<string>('');

  // Effect to suggest minimum quantity when price changes
  useEffect(() => {
    if (orderType !== 'market' && price) {
      const priceValue = parseFloat(price);
      if (priceValue > 0) {
        const minQuantity = calculateMinimumQuantity(symbol, priceValue);
        const currentQuantity = parseFloat(quantity);

        // If current quantity is less than minimum, suggest updating it
        if (currentQuantity < minQuantity) {
          console.log(
            `Current quantity ${currentQuantity} is less than minimum ${minQuantity}`,
          );
          // We don't automatically update to avoid disrupting user input
        }
      }
    }
  }, [price, symbol, orderType]);

  // Effect to set default quantities and prices when symbol changes
  useEffect(() => {
    // Default quantities for different symbols (above minimum notional value)
    const defaultQuantities: Record<string, string> = {
      'BTC/USDT': '0.0004', // For BTC at ~25,000 USDT
      'ETH/USDT': '0.08', // For ETH at ~130 USDT
      'BNB/USDT': '0.04', // For BNB at ~250 USDT
      'SOL/USDT': '0.2', // For SOL at ~50 USDT
      'XRP/USDT': '20', // For XRP at ~0.5 USDT
    };

    // Default prices for different symbols (approximate market prices)
    const defaultPrices: Record<string, string> = {
      'BTC/USDT': '25000',
      'ETH/USDT': '1300',
      'BNB/USDT': '250',
      'SOL/USDT': '50',
      'XRP/USDT': '0.5',
    };

    // Set the default quantity for the selected symbol
    const defaultQty = defaultQuantities[symbol];
    if (defaultQty) {
      setQuantity(defaultQty);
    }

    // Set the default price for the selected symbol
    const defaultPrice = defaultPrices[symbol];
    if (defaultPrice) {
      setPrice(defaultPrice);
    }
  }, [symbol]);

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

      // Check minimum notional value (price * quantity)
      const notionalValue = parseFloat(price) * parseFloat(quantity);
      console.log(`Order notional value: ${notionalValue}`);

      // Binance Testnet minimum notional values (these vary by pair)
      const minimumNotionalValues: Record<string, number> = {
        'BTC/USDT': 10,
        'ETH/USDT': 10,
        'BNB/USDT': 10,
        'SOL/USDT': 10,
        'XRP/USDT': 10,
        // Add more pairs as needed
      };

      const minimumNotional = minimumNotionalValues[symbol] || 10; // Default to 10 USDT

      if (notionalValue < minimumNotional) {
        throw new Error(
          `Order notional value (${notionalValue.toFixed(8)}) is less than the minimum required (${minimumNotional}) for ${symbol}. Try increasing the quantity.`,
        );
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
            id: order.id,
            userId: 'current-user',
            exchangeId: order.exchangeId || 'binance_testnet',
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            status: order.status || 'new',
            price: order.price,
            stopPrice: order.stopPrice,
            quantity: order.quantity,
            filledQuantity: order.executed || 0,
            // Ensure dates are in the correct format
            createdAt: order.timestamp
              ? new Date(order.timestamp).toISOString()
              : new Date().toISOString(),
            updatedAt: order.lastUpdated
              ? new Date(order.lastUpdated).toISOString()
              : new Date().toISOString(),
          };

          console.log('Formatted order for localStorage:', formattedOrder);
          currentOrders.push(formattedOrder);
          localStorage.setItem(
            'omnitrade_mock_orders',
            JSON.stringify(currentOrders),
          );
          console.log(
            'Order saved to localStorage with correct format:',
            formattedOrder,
          );

          // Log the current orders in localStorage for debugging
          console.log('Current orders in localStorage:', currentOrders);
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
      // First, try to get orders from localStorage
      let localOrders: any[] = [];
      try {
        const storedOrders = localStorage.getItem('omnitrade_mock_orders');
        if (storedOrders) {
          console.log('Raw stored orders from localStorage:', storedOrders);
          const parsedOrders = JSON.parse(storedOrders);

          // Filter for open orders (status = new or partially_filled) and matching symbol
          localOrders = parsedOrders.filter(
            (order: any) =>
              (order.status === 'new' || order.status === 'partially_filled') &&
              (!symbol || order.symbol === symbol),
          );

          console.log('Open orders from localStorage:', localOrders);
        }
      } catch (localError) {
        console.error('Error getting orders from localStorage:', localError);
      }

      // Then try to get orders from the adapter as a fallback
      try {
        // Get the Binance Testnet adapter
        const adapter = ExchangeFactory.getAdapter('binance_testnet');

        // Get open orders
        const adapterOrders = await adapter.getOpenOrders('default', symbol);
        console.log('Open orders from adapter:', adapterOrders);

        // Make sure adapterOrders is an array before mapping
        if (Array.isArray(adapterOrders) && adapterOrders.length > 0) {
          // Format orders to match what the component expects
          const formattedAdapterOrders = adapterOrders.map((order) => ({
            id: order.id,
            userId: 'current-user',
            exchangeId: order.exchangeId || 'binance_testnet',
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            status: order.status || 'new',
            price: order.price,
            stopPrice: order.stopPrice,
            quantity: order.quantity,
            filledQuantity: order.executed || 0,
          }));

          console.log('Formatted adapter orders:', formattedAdapterOrders);

          // Combine with local orders, removing duplicates
          formattedAdapterOrders.forEach((adapterOrder) => {
            if (
              !localOrders.some(
                (localOrder) => localOrder.id === adapterOrder.id,
              )
            ) {
              localOrders.push(adapterOrder);
            }
          });
        }
      } catch (adapterError) {
        console.warn(
          'Error getting orders from adapter, using localStorage only:',
          adapterError,
        );
      }

      // Set the combined orders
      console.log('Final open orders:', localOrders);
      setOpenOrders(localOrders);

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
      console.log('Order history from adapter:', orders);

      // Format orders to match what the component expects
      const formattedOrders = orders.map((order) => ({
        id: order.id,
        userId: 'current-user',
        exchangeId: order.exchangeId || 'binance_testnet',
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        status: order.status || 'filled',
        price: order.price,
        stopPrice: order.stopPrice,
        quantity: order.quantity,
        filledQuantity: order.executed || 0,
        avgFillPrice: order.price,
        createdAt: order.timestamp
          ? new Date(order.timestamp).toISOString()
          : new Date().toISOString(),
        updatedAt: order.lastUpdated
          ? new Date(order.lastUpdated).toISOString()
          : new Date().toISOString(),
      }));

      console.log('Formatted order history:', formattedOrders);
      setOrderHistory(formattedOrders);

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

        // Also update the order in localStorage to ensure it shows up in the OrdersTable
        try {
          const storedOrders = localStorage.getItem('omnitrade_mock_orders');
          if (storedOrders) {
            const parsedOrders = JSON.parse(storedOrders);
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

            localStorage.setItem(
              'omnitrade_mock_orders',
              JSON.stringify(updatedOrders),
            );
            console.log('Updated order status in localStorage:', updatedOrders);
          }
        } catch (storageError) {
          console.warn(
            'Failed to update order status in localStorage:',
            storageError,
          );
        }

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

  // Calculate minimum quantity for a given price
  const calculateMinimumQuantity = (
    symbolPair: string,
    priceValue: number,
  ): number => {
    // Binance Testnet minimum notional values
    const minimumNotionalValues: Record<string, number> = {
      'BTC/USDT': 10,
      'ETH/USDT': 10,
      'BNB/USDT': 10,
      'SOL/USDT': 10,
      'XRP/USDT': 10,
      // Add more pairs as needed
    };

    const minimumNotional = minimumNotionalValues[symbolPair] || 10; // Default to 10 USDT

    // Calculate minimum quantity: minimum notional / price
    return minimumNotional / priceValue;
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
                {orderType !== 'market' && price && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      Minimum quantity:{' '}
                      {calculateMinimumQuantity(
                        symbol,
                        parseFloat(price),
                      ).toFixed(6)}{' '}
                      {symbol.split('/')[0]}
                      (Min. order value: 10 USDT)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        const minQty = calculateMinimumQuantity(
                          symbol,
                          parseFloat(price),
                        );
                        // Add a small buffer (5%) to ensure we're above the minimum
                        const safeQty = (minQty * 1.05).toFixed(6);
                        setQuantity(safeQty);
                      }}
                    >
                      Use Min
                    </Button>
                  </div>
                )}
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
                  {price && quantity && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total order value:{' '}
                      {(parseFloat(price) * parseFloat(quantity)).toFixed(2)}{' '}
                      USDT
                    </p>
                  )}
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
