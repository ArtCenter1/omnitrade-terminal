import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useMarketDataStore } from "../store/marketDataStore";

// Helper to reset Zustand store state between tests
function resetStore() {
  const store = useMarketDataStore.getState();
  store.tickers = {};
  store.orderbooks = {};
  store.trades = {};
}

describe("marketDataStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("initializes with empty state", () => {
    const store = useMarketDataStore.getState();
    expect(store.tickers).toEqual({});
    expect(store.orderbooks).toEqual({});
    expect(store.trades).toEqual({});
  });

  it("updates ticker for a symbol", () => {
    act(() => {
      useMarketDataStore.getState().updateTicker("BTCUSDT", { price: "100", timestamp: 1 });
    });
    const store = useMarketDataStore.getState();
    expect(store.tickers["BTCUSDT"]).toEqual({ price: "100", timestamp: 1 });
  });

  it("updates orderbook for a symbol", () => {
    // Use tuple type for bids/asks
    const ob = { bids: [["1", "2"] as [string, string]], asks: [["3", "4"] as [string, string]], timestamp: 2 };
    act(() => {
      useMarketDataStore.getState().updateOrderbook("BTCUSDT", ob);
    });
    const store = useMarketDataStore.getState();
    expect(store.orderbooks["BTCUSDT"]).toEqual(ob);
  });

  it("adds trades for a symbol", () => {
    const trade1 = { price: "100", quantity: "1", timestamp: 1 };
    const trade2 = { price: "101", quantity: "2", timestamp: 2 };
    act(() => {
      useMarketDataStore.getState().addTrade("BTCUSDT", trade1);
      useMarketDataStore.getState().addTrade("BTCUSDT", trade2);
    });
    const store = useMarketDataStore.getState();
    expect(store.trades["BTCUSDT"]).toEqual([trade1, trade2]);
  });

  it("clears trades for a symbol", () => {
    const trade = { price: "100", quantity: "1", timestamp: 1 };
    act(() => {
      useMarketDataStore.getState().addTrade("BTCUSDT", trade);
      useMarketDataStore.getState().clearTrades("BTCUSDT");
    });
    const store = useMarketDataStore.getState();
    expect(store.trades["BTCUSDT"]).toEqual([]);
  });
});