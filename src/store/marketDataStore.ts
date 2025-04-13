import { create } from "zustand";
import MarketDataSocket from "../services/marketDataSocket";
import {
  WSTickerMessage,
  WSOrderbookUpdateMessage,
  WSTradeMessage,
  WebSocketMessage,
} from "../types/marketData";

type TickerState = {
  price: string;
  timestamp: number;
};

type OrderbookState = {
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
};

type TradeState = {
  price: string;
  quantity: string;
  timestamp: number;
};

/**
 * Zustand store interface for market data state and actions.
 * - tickers: Latest ticker data by symbol.
 * - orderbooks: Latest orderbook data by symbol.
 * - trades: Recent trades by symbol.
 * - updateTicker: Update ticker for a symbol.
 * - updateOrderbook: Update orderbook for a symbol.
 * - addTrade: Add a trade for a symbol.
 * - clearTrades: Clear all trades for a symbol.
 */
interface MarketDataStore {
  tickers: Record<string, TickerState>;
  orderbooks: Record<string, OrderbookState>;
  trades: Record<string, TradeState[]>;
  updateTicker: (symbol: string, data: TickerState) => void;
  updateOrderbook: (symbol: string, data: OrderbookState) => void;
  addTrade: (symbol: string, trade: TradeState) => void;
  clearTrades: (symbol: string) => void;
}

/**
 * Zustand hook for accessing and updating market data state.
 * Provides ticker, orderbook, and trade data, as well as actions to update them.
 * @returns {MarketDataStore} Market data state and actions.
 */
export const useMarketDataStore = create<MarketDataStore>((set, get) => ({
  tickers: {},
  orderbooks: {},
  trades: {},
  updateTicker: (symbol, data) =>
    set((state) => ({
      tickers: { ...state.tickers, [symbol]: data },
    })),
  updateOrderbook: (symbol, data) =>
    set((state) => ({
      orderbooks: { ...state.orderbooks, [symbol]: data },
    })),
  addTrade: (symbol, trade) =>
    set((state) => ({
      trades: {
        ...state.trades,
        [symbol]: [...(state.trades[symbol] || []), trade],
      },
    })),
  clearTrades: (symbol) =>
    set((state) => ({
      trades: { ...state.trades, [symbol]: [] },
    })),
}));

// --- WebSocket Integration ---

// Singleton handler registration guard
let handlerRegistered = false;

/**
 * Handles incoming WebSocket market data messages and updates the store accordingly.
 * @param {WebSocketMessage} msg - Incoming WebSocket message.
 */
function handleMarketDataMessage(msg: WebSocketMessage) {
  const store = useMarketDataStore.getState();
  if (msg.event === "ticker") {
    const { symbol, price, timestamp } = (msg as WSTickerMessage).data;
    store.updateTicker(symbol, { price, timestamp });
  } else if (msg.event === "orderbookUpdate") {
    // Note: No symbol in orderbookUpdate, so you may need to infer or extend protocol if needed.
    // For now, we assume only one symbol is subscribed at a time, or extend as needed.
    // Here, we skip symbol assignment. In production, ensure symbol is included.
    // store.updateOrderbook(symbol, { bids, asks, timestamp });
    // Placeholder: ignore if symbol is not present
  } else if (msg.event === "trade") {
    // No symbol in trade message; see above note.
    // store.addTrade(symbol, { price, quantity, timestamp });
  }
}

// Register handler once
if (!handlerRegistered) {
  MarketDataSocket.addMessageHandler(handleMarketDataMessage);
  handlerRegistered = true;
}

/**
 * Default export: Zustand hook for accessing the market data store.
 */
export default useMarketDataStore;