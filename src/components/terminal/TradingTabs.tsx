import React, { useState, useEffect } from 'react';
import { OrderTypeSelector } from './OrderTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingPair } from './TradingPairSelector';
import { useToast } from '@/components/ui/use-toast';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { placeOrder, CreateOrderDto } from '@/services/enhancedOrdersService';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { usePrice } from '@/contexts/PriceContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const { selectedPrice } = usePrice();

  // Use the selected pair or default to BTC/USDT
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

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
      }
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
        const calculatedTotal = (parseFloat(amount) * priceToUse).toFixed(8);
        setTotal(calculatedTotal);
        console.log(
          `Calculated total: ${calculatedTotal} ${selectedPair?.quoteAsset} using price: ${priceToUse} and amount: ${amount} ${selectedPair?.baseAsset}`,
        );
      }
    }
  }, [amount, price, orderType, selectedPair]);

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
      // Don't format while user is typing, only store the raw value
      setTotal(newTotal);

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

    // Get the current price
    if (orderType === 'market' && selectedPair?.price) {
      // For market orders, use the current pair price
      priceToUse = parseFloat(selectedPair.price.replace(/,/g, ''));
    } else if (price && !isNaN(parseFloat(price))) {
      // For limit/stop orders, use the entered price
      priceToUse = parseFloat(price);
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
        let formattedBaseAmount;
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
        let formattedQuoteAmount;
        if (percentage === 100) {
          formattedQuoteAmount = availableBalance.toFixed(2);
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
      let formattedBaseAmount;
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
        let formattedQuoteAmount;
        if (percentage === 100) {
          // For 100% of the base asset, calculate the exact total
          formattedQuoteAmount = (availableBalance * priceToUse).toFixed(2);
        } else {
          formattedQuoteAmount = quoteAmount.toFixed(2);
        }
        console.log(`Setting total to ${formattedQuoteAmount} ${quoteAsset}`);
        setTotal(formattedQuoteAmount);
      } else {
        console.log('No valid price available, setting default total');
        setTotal('0.00');
      }
    }
  };

  const handlePlaceOrder = async () => {
    console.log('TradingTabs handlePlaceOrder called');

    // Log current state for debugging
    console.log('Current state:', {
      selectedAccount,
      selectedPair,
      orderType,
      side,
      amount,
      price,
      total,
      isSubmitting,
    });

    if (!selectedAccount) {
      console.log('No exchange selected, showing toast');
      toast({
        title: 'No exchange selected',
        description: 'Please select an exchange account first.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPair) {
      console.log('No trading pair selected, showing toast');
      toast({
        title: 'No trading pair selected',
        description: 'Please select a trading pair first.',
        variant: 'destructive',
      });
      return;
    }

    console.log(
      'Amount value:',
      amount,
      'parseFloat result:',
      parseFloat(amount),
    );
    if (!amount || parseFloat(amount) <= 0) {
      console.log('Invalid amount, showing toast');
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price for limit orders.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    toast({
      title: 'Processing order...',
      description: `${side.toUpperCase()} ${amount} ${baseAsset}`,
    });

    try {
      console.log('Creating order DTO with account:', selectedAccount);

      // Ensure we have all required data
      if (!selectedAccount.exchange) {
        console.error(
          'Missing exchange ID in selectedAccount:',
          selectedAccount,
        );
        throw new Error('Exchange ID is missing');
      }

      if (!selectedPair.symbol) {
        console.error('Missing symbol in selectedPair:', selectedPair);
        throw new Error('Trading pair symbol is missing');
      }

      const orderDto: CreateOrderDto = {
        exchangeId: selectedAccount.exchange,
        symbol: selectedPair.symbol,
        side,
        type: orderType,
        quantity: parseFloat(amount),
      };

      if (orderType === 'limit' || orderType === 'stop') {
        if (!price || isNaN(parseFloat(price))) {
          console.error('Invalid price for limit/stop order:', price);
          throw new Error('Price is required for limit/stop orders');
        }
        orderDto.price = parseFloat(price);
      } else if (orderType === 'market') {
        // For market orders, use the current pair price
        if (selectedPair?.price) {
          const parsedPrice = parseFloat(selectedPair.price.replace(/,/g, ''));
          console.log(
            `Using current pair price: ${parsedPrice} from ${selectedPair.price}`,
          );
          orderDto.price = parsedPrice;
        } else {
          // Default price if none is available
          const defaultPrice =
            baseAsset === 'BTC' ? 60000 : baseAsset === 'ETH' ? 3000 : 10;
          console.log(`Using default price: ${defaultPrice} for ${baseAsset}`);
          orderDto.price = defaultPrice;
        }
      }

      console.log('Placing order with data:', orderDto);
      console.log('Calling placeOrder function...');
      const order = await placeOrder(orderDto);
      console.log('Order placed successfully:', order);

      // Show success toast with more details
      toast({
        title: 'Order placed successfully',
        description: `${side.toUpperCase()} ${amount} ${selectedPair.baseAsset} at ${orderType === 'market' ? 'market price' : price}. Order ID: ${order.id.substring(0, 8)}...`,
        variant: 'default',
      });

      // Reset form
      setAmount('');
      setPrice('');
      setTotal('');

      // Notify parent component to refresh orders
      if (onOrderPlaced) {
        console.log('Notifying parent component that order was placed');
        // Add a small delay to ensure the order is saved before refreshing
        setTimeout(() => {
          onOrderPlaced();
        }, 500);
      }
    } catch (error) {
      console.error('Error placing order:', error);

      // Safely extract error information
      const errorObj = error as any; // Type assertion to access properties safely
      const errorName = errorObj?.name || '';
      const errorMessage = errorObj?.message || 'Unknown error';
      const errorCode = errorObj?.code || '';

      console.log('Error details:', { errorName, errorMessage, errorCode });

      // Check if it's a network error or connection refused error
      if (
        (errorName === 'Error' && errorMessage.includes('Network')) ||
        errorMessage.includes('ECONNREFUSED') ||
        errorCode === 'ECONNREFUSED'
      ) {
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
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        // Redirect to login page or refresh token
      }
      // Handle other errors
      else {
        toast({
          title: 'Failed to place order',
          description: error instanceof Error ? errorMessage : 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
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
          console.log('Buy/Sell button clicked');
          try {
            handlePlaceOrder();
          } catch (err) {
            console.error('Error in button click handler:', err);
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
