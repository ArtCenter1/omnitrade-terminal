import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSymbols, useTicker, useOrderbook, useTrades, useKlines } from "../services/marketDataApi";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("marketDataApi hooks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("useSymbols fetches symbols successfully", async () => {
    const symbols = [{ symbol: "BTCUSDT" }, { symbol: "ETHUSDT" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => symbols,
    });

    const { result, waitFor } = renderHook(() => useSymbols(), { wrapper });
    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toEqual(symbols);
    expect(mockFetch).toHaveBeenCalledWith("/api/market-data/symbols", expect.any(Object));
  });

  it("useTicker fetches ticker for a symbol", async () => {
    const ticker = { price: "100", timestamp: 123456 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ticker,
    });

    const { result, waitFor } = renderHook(() => useTicker("BTCUSDT"), { wrapper });
    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toEqual(ticker);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/market-data/ticker?symbol=BTCUSDT",
      expect.any(Object)
    );
  });

  it("useOrderbook fetches orderbook for a symbol", async () => {
    const orderbook = { bids: [], asks: [], timestamp: 123456 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => orderbook,
    });

    const { result, waitFor } = renderHook(() => useOrderbook("BTCUSDT"), { wrapper });
    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toEqual(orderbook);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/market-data/orderbook?symbol=BTCUSDT",
      expect.any(Object)
    );
  });

  it("useTrades fetches trades for a symbol", async () => {
    const trades = [{ price: "100", quantity: "1", timestamp: 123456 }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => trades,
    });

    const { result, waitFor } = renderHook(() => useTrades("BTCUSDT", 1), { wrapper });
    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toEqual(trades);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/market-data/trades?symbol=BTCUSDT&limit=1",
      expect.any(Object)
    );
  });

  it("useKlines fetches klines for a symbol", async () => {
    const klines = [{ open: "1", close: "2", timestamp: 123456 }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => klines,
    });

    const { result, waitFor } = renderHook(() => useKlines("BTCUSDT", "1m", 1), { wrapper });
    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toEqual(klines);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/market-data/klines?symbol=BTCUSDT&interval=1m&limit=1",
      expect.any(Object)
    );
  });

  it("handles API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Server error",
    });

    const { result, waitFor } = renderHook(() => useSymbols(), { wrapper });
    await waitFor(() => result.current.isError);

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toMatch(/API error/);
  });

  it("handles network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network down"));

    const { result, waitFor } = renderHook(() => useSymbols(), { wrapper });
    await waitFor(() => result.current.isError);

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toMatch(/Network or parsing error/);
  });
});