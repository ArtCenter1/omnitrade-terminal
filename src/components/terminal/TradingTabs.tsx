import React, { useState, useEffect } from 'react';
import { OrderTypeSelector } from './OrderTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingPair } from './TradingPairSelector';
import { useToast } from '@/components/ui/use-toast';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { placeOrder, CreateOrderDto } from '@/services/ordersService';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { usePrice } from '@/contexts/PriceContext';

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
    setTotal(newTotal);

    if (!isNaN(parseFloat(newTotal))) {
      let priceToUse = 0;

      if (orderType === 'market' && selectedPair?.price) {
        // For market orders, use the current pair price
        priceToUse = parseFloat(selectedPair.price.replace(/,/g, ''));
      } else if (price && !isNaN(parseFloat(price))) {
        // For limit/stop orders, use the entered price
        priceToUse = parseFloat(price);
      }

      if (priceToUse > 0) {
        const calculatedAmount = (parseFloat(newTotal) / priceToUse).toFixed(8);
        setAmount(calculatedAmount);
        console.log(
          `Calculated amount: ${calculatedAmount} using price: ${priceToUse} and total: ${newTotal}`,
        );
      }
    }
  };

  const handleOrderTypeChange = (value: string) => {
    setOrderType(value as 'market' | 'limit' | 'stop');
  };

  const handlePercentageClick = (percentage: number) => {
    console.log(`Percentage button clicked: ${percentage}%`);
    // Get the available balance for the current asset from the mock portfolio data
    let availableBalance = 0;
    let priceToUse = 0;

    // Use the selectedAccount from the component state
    const portfolioData = selectedAccount
      ? getMockPortfolioData(selectedAccount.apiKeyId).data
      : null;

    console.log('Portfolio data:', portfolioData);
    console.log(
      `Getting available balance for ${side} order with ${baseAsset}/${quoteAsset} pair`,
    );

    // Get the current price
    if (orderType === 'market' && selectedPair?.price) {
      // For market orders, use the current pair price
      priceToUse = parseFloat(selectedPair.price.replace(/,/g, ''));
    } else if (price && !isNaN(parseFloat(price))) {
      // For limit/stop orders, use the entered price
      priceToUse = parseFloat(price);
    }

    if (portfolioData && portfolioData.assets) {
      if (side === 'buy') {
        // For buy orders, use the quote asset (e.g., USDT) directly
        const quoteAssetData = portfolioData.assets.find(
          (asset) => asset.asset === quoteAsset,
        );

        if (quoteAssetData) {
          // Use the quote asset balance directly
          availableBalance = quoteAssetData.total;
          console.log(`Found ${quoteAsset} balance: ${availableBalance}`);
        } else {
          console.log(
            `${quoteAsset} not found in portfolio, using default value`,
          );
          availableBalance =
            quoteAsset === 'USDT' ? 16000 : quoteAsset === 'BTC' ? 0.38 : 10;
        }

        // Calculate the percentage of the quote asset
        const quoteAmount = (availableBalance * percentage) / 100;
        console.log(
          `${percentage}% of ${availableBalance} ${quoteAsset} = ${quoteAmount} ${quoteAsset}`,
        );

        // If we have a valid price, convert to the equivalent base asset amount
        if (priceToUse > 0) {
          const baseAmount = quoteAmount / priceToUse;
          console.log(
            `${quoteAmount} ${quoteAsset} = ${baseAmount} ${baseAsset} at price ${priceToUse}`,
          );

          // Set the amount to the calculated base asset amount
          setAmount(baseAmount.toFixed(8));

          // Set the total to the calculated quote asset amount
          setTotal(quoteAmount.toFixed(2));

          // Return early since we've already set the amount and total
          return;
        }
      } else if (side === 'sell') {
        // For sell orders, use the base asset (e.g., BTC, ETH, DOT) directly
        const baseAssetData = portfolioData.assets.find(
          (asset) => asset.asset === baseAsset,
        );

        if (baseAssetData) {
          // Use the base asset balance directly
          availableBalance = baseAssetData.total;
          console.log(`Found ${baseAsset} balance: ${availableBalance}`);
        } else {
          console.log(
            `${baseAsset} not found in portfolio, using default value`,
          );
          if (baseAsset === 'BTC') availableBalance = 0.28;
          else if (baseAsset === 'ETH') availableBalance = 2.5;
          else if (baseAsset === 'DOT') availableBalance = 43.41;
          else availableBalance = 10; // Default for other assets
        }

        // Calculate the percentage of the base asset
        const baseAmount = (availableBalance * percentage) / 100;
        console.log(
          `${percentage}% of ${availableBalance} ${baseAsset} = ${baseAmount} ${baseAsset}`,
        );

        // Set the amount to the calculated base asset amount
        setAmount(baseAmount.toFixed(8));

        // If we have a valid price, calculate the total in quote asset
        if (priceToUse > 0) {
          const quoteAmount = baseAmount * priceToUse;
          console.log(
            `${baseAmount} ${baseAsset} = ${quoteAmount} ${quoteAsset} at price ${priceToUse}`,
          );

          // Set the total to the calculated quote asset amount
          setTotal(quoteAmount.toFixed(2));
        } else {
          // If we don't have a valid price, just set a default total
          setTotal('0.00');
        }

        // Return early since we've already set the amount and total
        return;
      }
    } else {
      // Fallback to hardcoded values if portfolio data is not available
      console.log('No portfolio data available, using default values');

      if (side === 'buy') {
        // For buy orders, use the quote asset (e.g., USDT) directly
        let quoteBalance = 0;

        // Set default quote asset balance
        if (quoteAsset === 'USDT') quoteBalance = 16000;
        else if (quoteAsset === 'BTC') quoteBalance = 0.38;
        else quoteBalance = 10;

        // Calculate the percentage of the quote asset
        const quoteAmount = (quoteBalance * percentage) / 100;
        console.log(
          `${percentage}% of ${quoteBalance} ${quoteAsset} = ${quoteAmount} ${quoteAsset}`,
        );

        // If we have a valid price, convert to the equivalent base asset amount
        if (priceToUse > 0) {
          const baseAmount = quoteAmount / priceToUse;
          console.log(
            `${quoteAmount} ${quoteAsset} = ${baseAmount} ${baseAsset} at price ${priceToUse}`,
          );

          // Set the amount to the calculated base asset amount
          setAmount(baseAmount.toFixed(8));

          // Set the total to the calculated quote asset amount
          setTotal(quoteAmount.toFixed(2));

          // Return early since we've already set the amount and total
          return;
        }
      } else {
        // For sell orders, use the base asset (e.g., BTC, ETH, DOT) directly
        let baseBalance = 0;

        // Set default base asset balance
        if (baseAsset === 'BTC') baseBalance = 0.28;
        else if (baseAsset === 'ETH') baseBalance = 2.5;
        else if (baseAsset === 'DOT') baseBalance = 43.41;
        else baseBalance = 10; // Default for other assets

        // Calculate the percentage of the base asset
        const baseAmount = (baseBalance * percentage) / 100;
        console.log(
          `${percentage}% of ${baseBalance} ${baseAsset} = ${baseAmount} ${baseAsset}`,
        );

        // Set the amount to the calculated base asset amount
        setAmount(baseAmount.toFixed(8));

        // If we have a valid price, calculate the total in quote asset
        if (priceToUse > 0) {
          const quoteAmount = baseAmount * priceToUse;
          console.log(
            `${baseAmount} ${baseAsset} = ${quoteAmount} ${quoteAsset} at price ${priceToUse}`,
          );

          // Set the total to the calculated quote asset amount
          setTotal(quoteAmount.toFixed(2));
        } else {
          // If we don't have a valid price, just set a default total
          setTotal('0.00');
        }

        // Return early since we've already set the amount and total
        return;
      }
    }

    // If we get here, something went wrong, so just set default values
    console.log('Using fallback calculation');
    const newAmount = ((availableBalance * percentage) / 100).toFixed(8);
    console.log(`Setting amount to ${newAmount}`);
    setAmount(newAmount);
  };

  const handlePlaceOrder = async () => {
    console.log('TradingTabs handlePlaceOrder called');
    if (!selectedAccount) {
      toast({
        title: 'No exchange selected',
        description: 'Please select an exchange account first.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPair) {
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

    try {
      const orderDto: CreateOrderDto = {
        exchangeId: selectedAccount.exchange,
        symbol: selectedPair.symbol,
        side,
        type: orderType,
        quantity: parseFloat(amount),
      };

      if (orderType === 'limit' || orderType === 'stop') {
        orderDto.price = parseFloat(price);
      } else if (orderType === 'market') {
        // For market orders, use the current pair price
        if (selectedPair?.price) {
          orderDto.price = parseFloat(selectedPair.price.replace(/,/g, ''));
        } else {
          // Default price if none is available
          orderDto.price =
            baseAsset === 'BTC' ? 60000 : baseAsset === 'ETH' ? 3000 : 10;
        }
      }

      console.log('Placing order with data:', orderDto);
      const order = await placeOrder(orderDto);
      console.log('Order placed successfully:', order);

      toast({
        title: 'Order placed successfully',
        description: `${side.toUpperCase()} ${amount} ${selectedPair.baseAsset} at ${orderType === 'market' ? 'market price' : price}`,
      });

      // Reset form
      setAmount('');
      setPrice('');
      setTotal('');

      // Notify parent component
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Failed to place order',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
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
        onClick={() => {
          console.log('Buy/Sell button clicked');
          handlePlaceOrder();
        }}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Processing...'
          : `Place ${side === 'buy' ? 'Buy' : 'Sell'} Order`}
      </Button>
    </div>
  );
}
