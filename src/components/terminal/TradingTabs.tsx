import React, { useState, useEffect } from 'react';
import { OrderTypeSelector } from './OrderTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingPair } from '@/types/trading';
import { useToast } from '@/components/ui/use-toast';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { CreateOrderDto, Order } from '@/services/enhancedOrdersService';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { usePrice } from '@/contexts/PriceContext';
import { mockExchangeService } from '@/services/mockExchangeService';
import logger from '@/utils/logger';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { useFeatureFlags } from '@/config/featureFlags';

interface TradingTabsProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

export function TradingTabs({ selectedPair, onOrderPlaced }: TradingTabsProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>(
    'market',
  );
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('0.001');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { selectedAccount } = useSelectedAccount();
  const { selectedPrice, setCurrentPairSymbol, getBestPrice } = usePrice();

  // Use the selected pair or default to BTC/USDT
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  // Update the current pair symbol in the PriceContext when it changes
  useEffect(() => {
    if (selectedPair?.symbol) {
      console.log(
        `TradingTabs: Updating currentPairSymbol to ${selectedPair.symbol}`,
      );
      setCurrentPairSymbol(selectedPair.symbol);
    }
  }, [selectedPair?.symbol, setCurrentPairSymbol]);

  // Set initial price based on selected pair when component mounts or pair changes
  useEffect(() => {
    if (selectedPair) {
      // For DOT/BTC pair, use a realistic price (DOT is much cheaper than BTC)
      if (
        selectedPair.baseAsset === 'DOT' &&
        selectedPair.quoteAsset === 'BTC'
      ) {
        // DOT is approximately 0.00033 BTC
        setPrice('0.00033');
      } else if (selectedPair.price) {
        // For other pairs, use the price from the pair data
        const currentPrice = selectedPair.price.replace(/,/g, '');
        setPrice(currentPrice);
      } else {
        // If no price is available, use a default price based on the asset
        const defaultPrice =
          selectedPair.baseAsset === 'BTC'
            ? 60000
            : selectedPair.baseAsset === 'ETH'
              ? 3000
              : 10;
        console.log(
          `No price in selectedPair, using default price: ${defaultPrice} for ${selectedPair.baseAsset}`,
        );
        setPrice(defaultPrice.toString());
      }

      console.log(`Initial price set to: ${price} for ${selectedPair.symbol}`);
    }
  }, [selectedPair]);

  // Update price when selectedPrice changes (from OrderBook clicks)
  useEffect(() => {
    if (selectedPrice && selectedPrice !== price) {
      console.log(`Setting price to ${selectedPrice} from OrderBook click`);
      setPrice(selectedPrice);

      // If we have an amount, update the total as well
      if (amount && !isNaN(parseFloat(amount))) {
        const priceValue = parseFloat(selectedPrice);
        const amountValue = parseFloat(amount);
        if (!isNaN(priceValue) && !isNaN(amountValue)) {
          const calculatedTotal = (amountValue * priceValue).toFixed(2);
          setTotal(calculatedTotal);
        }
      }

      // Automatically switch to limit order type when a price is selected
      if (orderType === 'market') {
        setOrderType('limit');
      }
    }
  }, [selectedPrice]);

  // Update total when amount or price changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      let priceToUse = 0;

      // Special handling for DOT/BTC pair
      if (
        selectedPair?.baseAsset === 'DOT' &&
        selectedPair?.quoteAsset === 'BTC'
      ) {
        // Use the realistic price for DOT/BTC
        priceToUse = 0.00033; // Fixed price for DOT/BTC
      } else if (orderType === 'market' && selectedPair?.price) {
        // For market orders, use the current pair price
        priceToUse = parseFloat(selectedPair.price.replace(/,/g, ''));
      } else if (price && !isNaN(parseFloat(price))) {
        // For limit/stop orders, use the entered price
        priceToUse = parseFloat(price);
      }

      if (priceToUse > 0) {
        // Calculate total (amount * price)
        const rawTotal = parseFloat(amount) * priceToUse;

        // Format based on quote asset
        let calculatedTotal: string;
        if (quoteAsset === 'USDT' || quoteAsset === 'USD') {
          // For USDT and USD, use 2 decimal places and ensure precision
          const roundedTotal = Math.floor(rawTotal * 100) / 100;
          calculatedTotal = roundedTotal.toFixed(2);
        } else {
          // For other assets, use 8 decimal places
          calculatedTotal = rawTotal.toFixed(8);
        }

        setTotal(calculatedTotal);
        console.log(
          `Calculated total: ${calculatedTotal} ${selectedPair?.quoteAsset} using price: ${priceToUse} and amount: ${amount} ${selectedPair?.baseAsset}`,
        );
      }
    }
  }, [amount, price, orderType, selectedPair, quoteAsset]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Amount changed to:', e.target.value);
    setAmount(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = e.target.value;

    // Format the total to 2 decimal places if it's a valid number
    if (!isNaN(parseFloat(newTotal))) {
      // For USDT and USD, ensure we have exactly 2 decimal places
      if (quoteAsset === 'USDT' || quoteAsset === 'USD') {
        // Don't format while user is typing, only store the raw value
        // But ensure we're not adding extra decimal places
        if (newTotal.includes('.') && newTotal.split('.')[1].length > 2) {
          // If user entered more than 2 decimal places, truncate to 2
          const truncated = Math.floor(parseFloat(newTotal) * 100) / 100;
          setTotal(truncated.toFixed(2));
        } else {
          setTotal(newTotal);
        }
      } else {
        // For other assets, allow up to 8 decimal places
        setTotal(newTotal);
      }

      let priceToUse = 0;

      if (orderType === 'market' && selectedPair?.price) {
        // For market orders, use the current pair price
        priceToUse = parseFloat(selectedPair.price.replace(/,/g, ''));
      } else if (price && !isNaN(parseFloat(price))) {
        // For limit/stop orders, use the entered price
        priceToUse = parseFloat(price);
      }

      if (priceToUse > 0) {
        // Calculate the amount with high precision to avoid rounding errors
        const totalValue = parseFloat(newTotal);
        const calculatedAmount = (totalValue / priceToUse).toFixed(8);
        console.log(
          `Calculated amount: ${calculatedAmount} using price: ${priceToUse} and total: ${totalValue}`,
        );
        setAmount(calculatedAmount);
      }
    } else {
      // If it's not a valid number, just set the raw value
      setTotal(newTotal);
    }
  };

  const handleOrderTypeChange = (value: string) => {
    setOrderType(value as 'market' | 'limit' | 'stop');
  };

  const handlePercentageClick = (percentage: number) => {
    console.log(`Percentage button clicked: ${percentage}%`);
    console.log(
      `Current side: ${side}, baseAsset: ${baseAsset}, quoteAsset: ${quoteAsset}`,
    );

    // Get the available balance for the current asset from the mock portfolio data
    let availableBalance = 0;
    let priceToUse = 0;

    // Use the selectedAccount from the component state
    const portfolioData = selectedAccount
      ? getMockPortfolioData(selectedAccount.apiKeyId).data
      : null;

    console.log('Portfolio data:', portfolioData);

    // Get the best price to use from the PriceContext
    const bestPrice = getBestPrice();
    console.log(`Best price from PriceContext: ${bestPrice}`);

    // For limit/stop orders, use the entered price if available
    if (orderType !== 'market' && price && !isNaN(parseFloat(price))) {
      priceToUse = parseFloat(price);
      console.log(
        `Using manually entered price: ${priceToUse} for limit/stop order`,
      );
    } else {
      // For market orders or if no price is entered, try to get price from mockExchangeService
      const exchangeId = selectedAccount?.exchangeId || 'binance';
      const pairSymbol = selectedPair?.symbol || `${baseAsset}/${quoteAsset}`;
      const currentPrice = mockExchangeService.getCurrentPrice(
        exchangeId,
        pairSymbol,
      );
      console.log(`Got price from mockExchangeService: ${currentPrice}`);

      // Use the price from mockExchangeService if available, otherwise fall back to PriceContext
      if (currentPrice && parseFloat(currentPrice) > 0) {
        priceToUse = parseFloat(currentPrice);
        console.log(`Using price from mockExchangeService: ${priceToUse}`);
      } else {
        // Fall back to PriceContext
        priceToUse = parseFloat(bestPrice);
        console.log(`Falling back to PriceContext price: ${priceToUse}`);
      }

      // Also update the price state so it's available for the order
      if (priceToUse > 0 && (!price || price === '0' || price === '0.00')) {
        setPrice(priceToUse.toString());
      }
    }

    // Final check to ensure we have a valid price
    if (priceToUse <= 0) {
      // Default price if none is available
      const defaultPrice =
        baseAsset === 'BTC' ? 60000 : baseAsset === 'ETH' ? 3000 : 10;
      console.log(
        `No valid price available, using default price: ${defaultPrice} for ${baseAsset}`,
      );
      priceToUse = defaultPrice;

      // Also update the price state so it's available for the order
      setPrice(defaultPrice.toString());
    }

    console.log(`Using price: ${priceToUse} for calculations`);

    // For buy orders, we need to use the quote asset (e.g., USDT) balance
    // For sell orders, we need to use the base asset (e.g., BTC) balance
    const assetToUse = side === 'buy' ? quoteAsset : baseAsset;
    console.log(`Using ${assetToUse} balance for ${side} order`);

    // Get the balance of the asset we need to use
    if (portfolioData && portfolioData.assets) {
      const assetData = portfolioData.assets.find(
        (asset) => asset.asset === assetToUse,
      );

      if (assetData) {
        availableBalance = assetData.total;
        console.log(`Found ${assetToUse} balance: ${availableBalance}`);
      } else {
        console.log(
          `${assetToUse} not found in portfolio, using default value`,
        );
        // Set default balance based on the asset
        if (assetToUse === 'USDT') availableBalance = 16000;
        else if (assetToUse === 'BTC') availableBalance = 0.28;
        else if (assetToUse === 'ETH') availableBalance = 2.5;
        else if (assetToUse === 'DOT') availableBalance = 43.41;
        else availableBalance = 10; // Default for other assets
      }
    } else {
      console.log('No portfolio data available, using default values');
      // Set default balance based on the asset
      if (assetToUse === 'USDT') availableBalance = 16000;
      else if (assetToUse === 'BTC') availableBalance = 0.28;
      else if (assetToUse === 'ETH') availableBalance = 2.5;
      else if (assetToUse === 'DOT') availableBalance = 43.41;
      else availableBalance = 10; // Default for other assets
    }

    // Calculate the percentage of the available balance
    const assetAmount = (availableBalance * percentage) / 100;
    console.log(
      `${percentage}% of ${availableBalance} ${assetToUse} = ${assetAmount} ${assetToUse}`,
    );

    if (side === 'buy') {
      // For buy orders, we need to convert the quote asset amount to base asset amount
      if (priceToUse > 0) {
        const baseAmount = assetAmount / priceToUse;
        console.log(
          `Converting ${assetAmount} ${quoteAsset} to ${baseAmount} ${baseAsset} at price ${priceToUse}`,
        );

        // Set the amount to the calculated base asset amount (with appropriate precision)
        let formattedBaseAmount: string;
        if (percentage === 100 && priceToUse > 0) {
          // For 100%, calculate the exact amount to avoid floating point errors
          formattedBaseAmount = (availableBalance / priceToUse).toFixed(8);
        } else {
          formattedBaseAmount = baseAmount.toFixed(8);
        }
        console.log(`Setting amount to ${formattedBaseAmount} ${baseAsset}`);
        setAmount(formattedBaseAmount);

        // Set the total to the quote asset amount
        // For exact percentages like 100%, use the exact original value to avoid rounding errors
        let formattedQuoteAmount: string;
        if (percentage === 100) {
          // For 100%, use Math.floor to ensure we get a whole number without any decimal issues
          const exactAmount = Math.floor(availableBalance * 100) / 100;
          formattedQuoteAmount = exactAmount.toFixed(2);
          console.log(
            `Using exact amount for 100%: ${exactAmount} → ${formattedQuoteAmount}`,
          );
        } else {
          formattedQuoteAmount = assetAmount.toFixed(2);
        }
        console.log(`Setting total to ${formattedQuoteAmount} ${quoteAsset}`);
        setTotal(formattedQuoteAmount);
      } else {
        console.error('Invalid price for conversion:', priceToUse);
        toast({
          title: 'Invalid price',
          description: 'Cannot calculate amount with current price.',
          variant: 'destructive',
        });
      }
    } else {
      // sell
      // For sell orders, we use the base asset amount directly
      // Set the amount to the calculated base asset amount
      let formattedBaseAmount: string;
      if (percentage === 100) {
        // For 100%, use the exact available balance to avoid floating point errors
        formattedBaseAmount = availableBalance.toFixed(8);
      } else {
        formattedBaseAmount = assetAmount.toFixed(8);
      }
      console.log(`Setting amount to ${formattedBaseAmount} ${baseAsset}`);
      setAmount(formattedBaseAmount);

      // Calculate the total in quote asset if we have a valid price
      if (priceToUse > 0) {
        const quoteAmount = assetAmount * priceToUse;
        console.log(
          `Converting ${assetAmount} ${baseAsset} to ${quoteAmount} ${quoteAsset} at price ${priceToUse}`,
        );

        // Set the total to the calculated quote asset amount
        // For exact percentages, use precise calculation to avoid floating point errors
        let formattedQuoteAmount: string;
        if (percentage === 100) {
          // For 100% of the base asset, calculate the exact total
          // Use Math.floor to ensure we get a clean number without floating point issues
          const exactAmount =
            Math.floor(availableBalance * priceToUse * 100) / 100;
          formattedQuoteAmount = exactAmount.toFixed(2);
        } else {
          // Round to 2 decimal places for USDT/USD
          const roundedAmount = Math.floor(quoteAmount * 100) / 100;
          formattedQuoteAmount = roundedAmount.toFixed(2);
        }
        console.log(`Setting total to ${formattedQuoteAmount} ${quoteAsset}`);
        setTotal(formattedQuoteAmount);
      } else {
        console.log('No valid price available, setting default total');
        setTotal('0.00');
      }
    }
  };

  const { useBinanceTestnet } = useFeatureFlags();

  const handlePlaceOrder = async () => {
    logger.info('handlePlaceOrder called', {
      component: 'TradingTabs',
      method: 'handlePlaceOrder',
      data: { orderId: null, status: 'started' },
    });

    // Log current state for debugging
    logger.debug('Current state before order placement', {
      component: 'TradingTabs',
      method: 'handlePlaceOrder',
      data: {
        selectedAccount,
        selectedPair: selectedPair
          ? {
              symbol: selectedPair.symbol,
              baseAsset: selectedPair.baseAsset,
              quoteAsset: selectedPair.quoteAsset,
              price: selectedPair.price,
            }
          : null,
        orderType,
        side,
        amount,
        price,
        total,
        isSubmitting,
      },
    });

    if (!selectedAccount) {
      logger.warn('No exchange selected, showing toast', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
      });
      toast({
        title: 'No exchange selected',
        description: 'Please select an exchange account first.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPair) {
      logger.warn('No trading pair selected, showing toast', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
      });
      toast({
        title: 'No trading pair selected',
        description: 'Please select a trading pair first.',
        variant: 'destructive',
      });
      return;
    }

    logger.debug('Validating amount', {
      component: 'TradingTabs',
      method: 'handlePlaceOrder',
      data: {
        amount,
        parsedAmount: parseFloat(amount),
        isValid: amount && parseFloat(amount) > 0,
      },
    });

    if (!amount || parseFloat(amount) <= 0) {
      logger.warn('Invalid amount, showing toast', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: { amount },
      });
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      logger.warn('Invalid price for limit order, showing toast', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: { price, orderType },
      });
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price for limit orders.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    logger.info('Processing order, showing toast', {
      component: 'TradingTabs',
      method: 'handlePlaceOrder',
      data: { side, amount, baseAsset },
    });

    toast({
      title: 'Processing order...',
      description: `${side.toUpperCase()} ${amount} ${baseAsset}`,
    });

    try {
      // Determine which exchange adapter to use
      const exchangeId = selectedAccount.isSandbox
        ? useBinanceTestnet
          ? 'binance_testnet'
          : 'sandbox'
        : selectedAccount.exchange;

      logger.info('Placing order', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: {
          exchangeId,
          selectedAccount,
          useBinanceTestnet,
          isSandbox: selectedAccount.isSandbox,
        },
      });

      // Get the appropriate adapter
      const adapter = ExchangeFactory.getAdapter(exchangeId);

      // Prepare order parameters
      const orderParams: Partial<any> = {
        symbol: selectedPair.symbol,
        side,
        type: orderType,
        quantity: parseFloat(amount),
      };

      // Add price for limit orders
      if (orderType === 'limit' || orderType === 'stop') {
        if (!price || isNaN(parseFloat(price))) {
          logger.error('Invalid price for limit/stop order', {
            component: 'TradingTabs',
            method: 'handlePlaceOrder',
            data: { price, orderType },
          });
          throw new Error('Price is required for limit/stop orders');
        }
        orderParams.price = parseFloat(price);
      } else if (orderType === 'market') {
        // For market orders, try to get price from mockExchangeService first
        const pairSymbol = selectedPair?.symbol || `${baseAsset}/${quoteAsset}`;

        logger.debug('Getting price from mockExchangeService', {
          component: 'TradingTabs',
          method: 'handlePlaceOrder',
          data: { exchangeId, pairSymbol },
        });

        const currentPrice = mockExchangeService.getCurrentPrice(
          exchangeId,
          pairSymbol,
        );

        if (currentPrice && parseFloat(currentPrice) > 0) {
          // Use the price from mockExchangeService
          const parsedPrice = parseFloat(currentPrice);
          orderParams.price = parsedPrice;
        } else {
          // Fall back to PriceContext
          const bestPrice = getBestPrice();

          if (bestPrice && bestPrice !== '0' && bestPrice !== '0.00') {
            const parsedPrice = parseFloat(bestPrice);
            orderParams.price = parsedPrice;
          } else if (selectedPair?.price) {
            // Fallback to selectedPair price
            const parsedPrice = parseFloat(
              selectedPair.price.replace(/,/g, ''),
            );
            orderParams.price = parsedPrice;
          } else {
            // Default price if none is available
            const defaultPrice =
              baseAsset === 'BTC' ? 60000 : baseAsset === 'ETH' ? 3000 : 10;
            orderParams.price = defaultPrice;
          }
        }
      }

      // Final check to ensure we have a valid price
      if (!orderParams.price || orderParams.price <= 0) {
        const defaultPrice =
          baseAsset === 'BTC' ? 60000 : baseAsset === 'ETH' ? 3000 : 10;
        orderParams.price = defaultPrice;
      }

      logger.debug('Order parameters', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: { orderParams },
      });

      // Place the order using the adapter
      // Use 'default' as the API key ID for now - in a real app, you would use the actual API key ID
      const startTime = Date.now();
      const order = await adapter.placeOrder('default', orderParams);
      const endTime = Date.now();

      logger.info('Order placed successfully', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: {
          order,
          executionTimeMs: endTime - startTime,
          orderId: order.id,
          status: 'success',
        },
      });

      // Manually trigger localStorage save to ensure the order is persisted
      const currentOrders = JSON.parse(
        localStorage.getItem('omnitrade_mock_orders') || '[]',
      );

      // Check if the order is already in localStorage
      const orderExists = currentOrders.some((o: any) => o.id === order.id);
      if (!orderExists) {
        currentOrders.push({
          ...order,
          createdAt:
            order.createdAt instanceof Date
              ? order.createdAt.toISOString()
              : order.createdAt,
          updatedAt:
            order.updatedAt instanceof Date
              ? order.updatedAt.toISOString()
              : order.updatedAt,
        });

        localStorage.setItem(
          'omnitrade_mock_orders',
          JSON.stringify(currentOrders),
        );
      }

      // Show success toast with more details
      logger.info('Showing success toast', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: {
          side,
          amount,
          baseAsset: selectedPair.baseAsset,
          orderType,
          price,
          orderId: order?.id,
        },
      });

      toast({
        title: 'Order placed successfully',
        description: `${side.toUpperCase()} ${amount} ${selectedPair.baseAsset} at ${orderType === 'market' ? 'market price' : price}${order ? `. Order ID: ${order.id.substring(0, 8)}...` : ''}`,
        variant: 'default',
      });

      // Reset form
      setAmount('');
      setPrice('');
      setTotal('');

      // Notify parent component to refresh orders
      if (onOrderPlaced) {
        logger.debug('Notifying parent component that order was placed', {
          component: 'TradingTabs',
          method: 'handlePlaceOrder',
        });

        // Add a small delay to ensure the order is saved before refreshing
        setTimeout(() => {
          onOrderPlaced();
        }, 500);
      }
    } catch (error) {
      logger.error('Error placing order', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: { error },
      });

      // Safely extract error information
      const errorObj = error as any; // Type assertion to access properties safely
      const errorName = errorObj?.name || '';
      const errorMessage = errorObj?.message || 'Unknown error';
      const errorCode = errorObj?.code || '';

      logger.error('Error details', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: { errorName, errorMessage, errorCode },
      });

      // Check if it's a Binance-specific error
      if (errorMessage.includes('MIN_NOTIONAL')) {
        toast({
          title: 'Order Too Small',
          description:
            'Order value is too small. Please increase the quantity or price.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('LOT_SIZE')) {
        toast({
          title: 'Invalid Quantity',
          description: 'Please check the minimum and maximum quantity limits.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('PRICE_FILTER')) {
        toast({
          title: 'Invalid Price',
          description: 'Please check the minimum and maximum price limits.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
        toast({
          title: 'Insufficient Balance',
          description: 'You do not have enough funds to place this order.',
          variant: 'destructive',
        });
      }
      // Check if it's a network error or connection refused error
      else if (
        (errorName === 'Error' && errorMessage.includes('Network')) ||
        errorMessage.includes('ECONNREFUSED') ||
        errorCode === 'ECONNREFUSED'
      ) {
        logger.warn('Server connection error', {
          component: 'TradingTabs',
          method: 'handlePlaceOrder',
          data: { errorName, errorMessage, errorCode },
        });

        toast({
          title: 'Server Connection Error',
          description:
            'Could not connect to the trading server. The order has been processed locally and will be synchronized when connection is restored.',
          variant: 'destructive',
        });
      }
      // Check if it's an authentication error
      else if (
        errorName === 'Error' &&
        errorMessage.includes('Authentication')
      ) {
        logger.warn('Authentication error', {
          component: 'TradingTabs',
          method: 'handlePlaceOrder',
          data: { errorName, errorMessage },
        });

        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        // Redirect to login page or refresh token
      }
      // Handle other errors
      else {
        logger.error('Failed to place order', {
          component: 'TradingTabs',
          method: 'handlePlaceOrder',
          data: { errorMessage },
        });

        toast({
          title: 'Failed to place order',
          description: error instanceof Error ? errorMessage : 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
      logger.info('Order placement process completed', {
        component: 'TradingTabs',
        method: 'handlePlaceOrder',
        data: { status: 'completed' },
      });
    }
  };

  return (
    <div className="px-1 py-2">
      <OrderTypeSelector
        activeOrderType={orderType}
        onOrderTypeChange={(type) => handleOrderTypeChange(type)}
      />

      <div className="grid grid-cols-2 gap-1 mb-2">
        <Button
          className={`${side === 'buy' ? 'bg-crypto-green' : 'bg-gray-800'} text-white h-8 px-2 py-0`}
          onClick={() => setSide('buy')}
        >
          Buy
        </Button>
        <Button
          className={`${side === 'sell' ? 'bg-crypto-red' : 'bg-gray-800'} text-white h-8 px-2 py-0`}
          onClick={() => setSide('sell')}
        >
          Sell
        </Button>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-400">Amount</span>
          <span className="text-xs text-gray-400">{baseAsset}</span>
        </div>
        <Input
          value={amount}
          onChange={handleAmountChange}
          className="bg-gray-900 border-gray-800 h-7 text-sm py-0"
          placeholder="0.001"
        />
      </div>

      {(orderType === 'limit' || orderType === 'stop') && (
        <div className="mb-2">
          <div className="flex justify-between mb-0.5">
            <span className="text-xs text-gray-400">Price</span>
            <span className="text-xs text-gray-400">{quoteAsset}</span>
          </div>
          <Input
            value={price}
            onChange={handlePriceChange}
            className="bg-gray-900 border-gray-800 h-7 text-sm py-0"
            placeholder={selectedPair?.price || '0.00'}
          />
        </div>
      )}

      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-xs text-gray-400">{quoteAsset}</span>
        </div>
        <Input
          value={total}
          onChange={handleTotalChange}
          className="bg-gray-900 border-gray-800 h-7 text-sm py-0"
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2">
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(25)}
        >
          25%
        </Button>
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(50)}
        >
          50%
        </Button>
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(75)}
        >
          75%
        </Button>
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(100)}
        >
          100%
        </Button>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-xs text-white">
            ≈ {total || '0.00'} {quoteAsset}
          </span>
        </div>
      </div>

      <Button
        className={`w-full ${side === 'buy' ? 'bg-crypto-green hover:bg-crypto-green/90' : 'bg-crypto-red hover:bg-crypto-red/90'} h-8 py-0`}
        onClick={(e) => {
          e.preventDefault();
          logger.info('Buy/Sell button clicked', {
            component: 'TradingTabs',
            method: 'buttonClickHandler',
            data: {
              side,
              orderType,
              amount,
              price,
              total,
              timestamp: new Date().toISOString(),
            },
          });
          try {
            logger.debug('Calling handlePlaceOrder from button click handler', {
              component: 'TradingTabs',
              method: 'buttonClickHandler',
            });
            handlePlaceOrder();
          } catch (err) {
            logger.error('Error in button click handler', {
              component: 'TradingTabs',
              method: 'buttonClickHandler',
              data: { error: err },
            });
          }
        }}
        disabled={isSubmitting}
        type="button"
      >
        {isSubmitting
          ? 'Processing...'
          : `Place ${side === 'buy' ? 'Buy' : 'Sell'} Order`}
      </Button>
    </div>
  );
}
