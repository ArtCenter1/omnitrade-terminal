import React, { useState, useEffect } from 'react';
import { OrderTypeSelector } from './OrderTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { useToast } from '@/components/ui/use-toast';
import { CreateOrderDto } from '@/services/enhancedOrdersService';
import { usePrice } from '@/contexts/PriceContext';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { useFeatureFlags } from '@/config/featureFlags';
import logger from '@/utils/logger';
import { balanceTrackingService } from '@/services/balanceTracking/balanceTrackingService';
import { tradingLimitsService } from '@/services/tradingLimits';

interface TradingFormProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

export function TradingForm({
  selectedPair,
  onOrderPlaced,
}: TradingFormProps = {}) {
  const { selectedAccount } = useSelectedAccount();
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>(
    'market',
  );
  const [amount, setAmount] = useState<string>('0');
  const [total, setTotal] = useState<string>('0');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedPrice } = usePrice();

  // Use the selected pair or default to BTC/USDT
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  const handleOrderTypeChange = (type: 'market' | 'limit' | 'stop') => {
    setOrderType(type);
  };

  // Update price when selectedPrice changes (from OrderBook clicks)
  useEffect(() => {
    if (selectedPrice) {
      console.log(`Setting price to ${selectedPrice} from OrderBook click`);

      // Automatically switch to limit order type when a price is selected
      if (orderType === 'market') {
        setOrderType('limit');
      }

      // If we have an amount, update the total as well
      if (amount && amount !== '0') {
        const priceValue = parseFloat(selectedPrice);
        const amountValue = parseFloat(amount);
        if (!isNaN(priceValue) && !isNaN(amountValue)) {
          const calculatedTotal = (amountValue * priceValue).toFixed(2);
          setTotal(calculatedTotal);
        }
      }
    }
  }, [selectedPrice]);

  const handlePercentageClick = (percentage: number) => {
    // Mock quote asset balance (what we're paying with)
    const quoteBalance =
      quoteAsset === 'USDT' ? 16000 : quoteAsset === 'BTC' ? 0.38 : 10;

    // Mock base asset balance (what we're selling)
    const baseBalance =
      baseAsset === 'BTC'
        ? 0.28
        : baseAsset === 'ETH'
          ? 2.5
          : baseAsset === 'DOT'
            ? 43.41
            : 10;

    // Get the current price
    const currentPrice = selectedPair?.price
      ? parseFloat(selectedPair.price.replace(/,/g, ''))
      : 20000;

    if (currentPrice > 0) {
      if (side === 'buy') {
        // For buy orders, use the quote asset (e.g., USDT) directly
        // Calculate the percentage of the quote asset
        const quoteAmount = (quoteBalance * percentage) / 100;
        console.log(
          `${percentage}% of ${quoteBalance} ${quoteAsset} = ${quoteAmount} ${quoteAsset}`,
        );

        // Convert to the equivalent base asset amount
        const baseAmount = quoteAmount / currentPrice;
        console.log(
          `${quoteAmount} ${quoteAsset} = ${baseAmount} ${baseAsset} at price ${currentPrice}`,
        );

        // Set the amount to the calculated base asset amount
        setAmount(baseAmount.toFixed(8));

        // Set the total to the calculated quote asset amount
        setTotal(quoteAmount.toFixed(2));
      } else {
        // For sell orders, use the base asset (e.g., BTC) directly
        // Calculate the percentage of the base asset
        const baseAmount = (baseBalance * percentage) / 100;
        console.log(
          `${percentage}% of ${baseBalance} ${baseAsset} = ${baseAmount} ${baseAsset}`,
        );

        // Calculate the equivalent quote asset amount
        const quoteAmount = baseAmount * currentPrice;
        console.log(
          `${baseAmount} ${baseAsset} = ${quoteAmount} ${quoteAsset} at price ${currentPrice}`,
        );

        // Set the amount to the calculated base asset amount
        setAmount(baseAmount.toFixed(8));

        // Set the total to the calculated quote asset amount
        setTotal(quoteAmount.toFixed(2));
      }
    } else {
      // If we don't have a valid price, use default values
      const baseAmount = (baseBalance * percentage) / 100;
      setAmount(baseAmount.toFixed(8));
      setTotal('0.00');
    }
  };

  const { useBinanceTestnet } = useFeatureFlags();

  const handlePlaceOrder = async () => {
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

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    // Determine which exchange adapter to use
    const exchangeId = selectedAccount.isSandbox
      ? useBinanceTestnet
        ? 'binance_testnet'
        : 'sandbox'
      : selectedAccount.exchange;

    // Get the price for the order
    const orderPrice =
      orderType === 'limit' && selectedPrice
        ? parseFloat(selectedPrice)
        : undefined;

    // Validate the order against trading limits
    const validationResult = tradingLimitsService.validateOrder(
      exchangeId,
      selectedPair.symbol,
      side,
      orderType,
      parseFloat(amount),
      orderPrice,
      'default', // Use 'default' as the API key ID for now
    );

    if (!validationResult.valid) {
      toast({
        title: 'Order validation failed',
        description: validationResult.message || 'Unknown validation error',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      logger.info('Placing order', {
        component: 'TradingForm',
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
      if (orderType === 'limit' && selectedPrice) {
        orderParams.price = parseFloat(selectedPrice);
      }

      logger.debug('Order parameters', {
        component: 'TradingForm',
        method: 'handlePlaceOrder',
        data: { orderParams },
      });

      // Reserve the balance for the order
      const balanceReserved = balanceTrackingService.reserveBalanceForOrder(
        exchangeId,
        'default', // Use 'default' as the API key ID for now
        selectedPair.symbol,
        side,
        orderType,
        parseFloat(amount),
        orderType === 'limit' && selectedPrice
          ? parseFloat(selectedPrice)
          : undefined,
      );

      if (!balanceReserved) {
        logger.warn('Failed to reserve balance for order', {
          component: 'TradingForm',
          method: 'handlePlaceOrder',
          data: { orderParams },
        });

        // Continue with the order placement anyway, as the exchange will do its own balance check
        // In a production environment, you might want to abort the order here
      }

      // Place the order using the adapter
      // Use 'default' as the API key ID for now - in a real app, you would use the actual API key ID
      const order = await adapter.placeOrder('default', orderParams);

      logger.info('Order placed successfully', {
        component: 'TradingForm',
        method: 'handlePlaceOrder',
        data: { order },
      });

      // Show success message
      toast({
        title: 'Order placed successfully',
        description: `${side.toUpperCase()} ${amount} ${baseAsset} at ${orderType === 'market' ? 'market price' : selectedPrice}`,
      });

      // Reset form
      setAmount('0');
      setTotal('0');

      // Notify parent component
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (error) {
      logger.error('Error placing order', {
        component: 'TradingForm',
        method: 'handlePlaceOrder',
        data: { error },
      });

      // If the order failed, release the reserved balance
      if (selectedPair) {
        balanceTrackingService.releaseReservedBalance(
          exchangeId,
          'default', // Use 'default' as the API key ID for now
          selectedPair.symbol,
          side,
          orderType,
          parseFloat(amount),
          orderType === 'limit' && selectedPrice
            ? parseFloat(selectedPrice)
            : undefined,
        );
      }

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
    <div className="border-t border-[var(--border-primary)] pt-6">
      <div className="mb-4">
        <OrderTypeSelector
          activeOrderType={orderType}
          onOrderTypeChange={handleOrderTypeChange}
        />
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          className={`flex-1 ${side === 'buy' ? 'bg-crypto-green' : 'bg-[var(--bg-tertiary)]'} hover:bg-crypto-green/90 text-[var(--text-primary)]`}
          onClick={() => setSide('buy')}
        >
          BUY {baseAsset}
        </Button>
        <Button
          className={`flex-1 ${side === 'sell' ? 'bg-crypto-red' : 'bg-[var(--bg-tertiary)]'} hover:bg-crypto-red/90 text-[var(--text-primary)]`}
          onClick={() => setSide('sell')}
        >
          SELL {baseAsset}
        </Button>
      </div>

      <div className="mb-4">
        <div className="text-[var(--text-secondary)] mb-2 text-xs">Amount</div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-[var(--text-secondary)] text-xs">{baseAsset}</div>
          <div className="flex items-center">
            <Input
              className="h-8 bg-[var(--bg-secondary)] border-[var(--border-primary)] text-right text-[var(--text-primary)] w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[var(--text-secondary)] mb-2 text-xs">Total</div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-[var(--text-secondary)] text-xs">{quoteAsset}</div>
          <div className="flex items-center">
            <Input
              className="h-8 bg-[var(--bg-secondary)] border-[var(--border-primary)] text-right text-[var(--text-primary)] w-full"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-4">
        <Button
          variant="outline"
          className="percentage-button text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(25)}
        >
          25%
        </Button>
        <Button
          variant="outline"
          className="percentage-button text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(50)}
        >
          50%
        </Button>
        <Button
          variant="outline"
          className="percentage-button text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(75)}
        >
          75%
        </Button>
        <Button
          variant="outline"
          className="percentage-button text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(100)}
        >
          100%
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <div className="text-xs text-[var(--text-secondary)]">Binance Fee</div>
          <div className="text-xs text-[var(--text-primary)]">= 0.00 {quoteAsset}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-xs text-[var(--text-secondary)]">Total</div>
          <div className="text-xs text-[var(--text-primary)]">
            = {total} {quoteAsset}
          </div>
        </div>
      </div>

      <Button
        className={`w-full ${side === 'buy' ? 'bg-crypto-green hover:bg-crypto-green/90' : 'bg-crypto-red hover:bg-crypto-red/90'} text-[var(--text-primary)]`}
        onClick={handlePlaceOrder}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Processing...'
          : `${side === 'buy' ? 'BUY' : 'SELL'} ${baseAsset}`}
      </Button>
    </div>
  );
}
