import React from "react";
import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import * as api from "../services/marketDataApi";
import * as store from "../store/marketDataStore";
import * as ws from "../services/marketDataSocket";
import { useTicker } from "../hooks/useTicker";

// Mock API hook, Zustand store, and WebSocket service
vi.mock("../services/marketDataApi", () => ({
  useTicker: vi.fn(),
}));
vi.mock("../store/marketDataStore", () => ({
  useMarketDataStore: vi.fn(),
}));
vi.mock("../services/marketDataSocket", () => ({
  default: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

const mockApiTicker = { price: "100", timestamp: 1 };
const mockRealtimeTicker = { price: "101", timestamp: 2 };

describe("useTicker (custom hook)", () => {
  beforeEach(() => {
    (api.useTicker as any).mockReturnValue({
      data: mockApiTicker,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    (store.useMarketDataStore as any).mockImplementation((selector: any) =>
      selector({ tickers: { BTCUSDT: undefined } })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns API ticker if no real-time data", () => {
    const { result } = renderHook(() => useTicker("BTCUSDT"));
    expect(result.current.ticker).toEqual(mockApiTicker);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("returns real-time ticker if available", () => {
    (store.useMarketDataStore as any).mockImplementation((selector: any) =>
      selector({ tickers: { BTCUSDT: mockRealtimeTicker } })
    );
    const { result } = renderHook(() => useTicker("BTCUSDT"));
    expect(result.current.ticker).toEqual(mockRealtimeTicker);
  });

  it("subscribes and unsubscribes to ticker channel", () => {
    const subscribe = ws.default.subscribe as any;
    const unsubscribe = ws.default.unsubscribe as any;
    const { unmount } = renderHook(() => useTicker("BTCUSDT"));
    expect(subscribe).toHaveBeenCalledWith("BTCUSDT", "ticker");
    unmount();
    expect(unsubscribe).toHaveBeenCalledWith("BTCUSDT", "ticker");
  });

  it("handles error and loading states", () => {
    (api.useTicker as any).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    let { result, rerender } = renderHook(() => useTicker("BTCUSDT"));
    expect(result.current.isLoading).toBe(true);

    (api.useTicker as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("fail"),
      refetch: vi.fn(),
    });
    rerender();
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});