import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/ui/use-toast';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { placeOrder, CreateOrderDto } from '../../services/ordersService';
import { TradingPair } from './TradingPairSelector';

interface OrderFormProps {
  selectedPair: TradingPair;
  onOrderPlaced: () => void;
}

export function OrderForm({ selectedPair, onOrderPlaced }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedAccount } = useSelectedAccount();

  // Update price when selected pair changes
  useEffect(() => {
    if (selectedPair) {
      setPrice(selectedPair.price.replace(/,/g, ''));
    }
  }, [selectedPair]);

  // Calculate total when price or quantity changes
  useEffect(() => {
    if (price && quantity) {
      const priceValue = parseFloat(price);
      const quantityValue = parseFloat(quantity);
      if (!isNaN(priceValue) && !isNaN(quantityValue)) {
        setTotal((priceValue * quantityValue).toFixed(2));
      } else {
        setTotal('');
      }
    } else {
      setTotal('');
    }
  }, [price, quantity]);

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setPrice(value);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setQuantity(value);
    }
  };

  // Handle total change (update quantity based on price)
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setTotal(value);
      if (value && price) {
        const totalValue = parseFloat(value);
        const priceValue = parseFloat(price);
        if (!isNaN(totalValue) && !isNaN(priceValue) && priceValue > 0) {
          setQuantity((totalValue / priceValue).toFixed(8));
        }
      }
    }
  };

  // Handle order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      toast({
        title: 'No exchange selected',
        description: 'Please select an exchange account first.',
        variant: 'destructive',
      });
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a valid quantity.',
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
        quantity: parseFloat(quantity),
      };

      if (orderType === 'limit') {
        orderDto.price = parseFloat(price);
      }

      const order = await placeOrder(orderDto);

      toast({
        title: 'Order placed successfully',
        description: `${side.toUpperCase()} ${quantity} ${selectedPair.baseAsset} at ${orderType === 'market' ? 'market price' : price}`,
        variant: 'default',
      });

      // Reset form
      setQuantity('');
      setTotal('');

      // Notify parent component
      onOrderPlaced();
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
    <div className="bg-[#1a1a1c] border border-gray-800 rounded-md p-4">
      <Tabs
        defaultValue="buy"
        onValueChange={(value) => setSide(value as 'buy' | 'sell')}
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-crypto-green data-[state=active]:text-white"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-crypto-red data-[state=active]:text-white"
          >
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-type">Order Type</Label>
              <Select
                value={orderType}
                onValueChange={(value) =>
                  setOrderType(value as 'market' | 'limit')
                }
              >
                <SelectTrigger
                  id="order-type"
                  className="bg-gray-900 border-gray-800"
                >
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === 'limit' && (
              <div className="space-y-2">
                <Label htmlFor="price">Price ({selectedPair.quoteAsset})</Label>
                <Input
                  id="price"
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  className="bg-gray-900 border-gray-800"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Amount ({selectedPair.baseAsset})
              </Label>
              <Input
                id="quantity"
                type="text"
                value={quantity}
                onChange={handleQuantityChange}
                className="bg-gray-900 border-gray-800"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total ({selectedPair.quoteAsset})</Label>
              <Input
                id="total"
                type="text"
                value={total}
                onChange={handleTotalChange}
                className="bg-gray-900 border-gray-800"
                placeholder="0.00"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-crypto-green hover:bg-crypto-green/90"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Placing Order...'
                : `Buy ${selectedPair.baseAsset}`}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-type-sell">Order Type</Label>
              <Select
                value={orderType}
                onValueChange={(value) =>
                  setOrderType(value as 'market' | 'limit')
                }
              >
                <SelectTrigger
                  id="order-type-sell"
                  className="bg-gray-900 border-gray-800"
                >
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === 'limit' && (
              <div className="space-y-2">
                <Label htmlFor="price-sell">
                  Price ({selectedPair.quoteAsset})
                </Label>
                <Input
                  id="price-sell"
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  className="bg-gray-900 border-gray-800"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity-sell">
                Amount ({selectedPair.baseAsset})
              </Label>
              <Input
                id="quantity-sell"
                type="text"
                value={quantity}
                onChange={handleQuantityChange}
                className="bg-gray-900 border-gray-800"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-sell">
                Total ({selectedPair.quoteAsset})
              </Label>
              <Input
                id="total-sell"
                type="text"
                value={total}
                onChange={handleTotalChange}
                className="bg-gray-900 border-gray-800"
                placeholder="0.00"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-crypto-red hover:bg-crypto-red/90"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Placing Order...'
                : `Sell ${selectedPair.baseAsset}`}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
