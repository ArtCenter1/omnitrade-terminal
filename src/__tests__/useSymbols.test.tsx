import React from "react";
import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import * as api from "../services/marketDataApi";
import { useSymbols } from "../hooks/useSymbols";

// Mock the API hook
// Mock the specific function used by the hook (useMarkets)
vi.mock("../services/marketDataApi", () => ({
  useMarkets: vi.fn(), // Mock only useMarkets
}));

function setupMockApi(data: any, overrides: any = {}) {
  // Mock the return value of useMarkets
  (api.useMarkets as any).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  });
}

describe("useSymbols (custom hook)", () => {
  it("returns symbols from API hook", () => {
    // Mock the market data returned by useMarkets
    const marketData = [{ id: "bitcoin" }, { id: "ethereum" }];
    setupMockApi(marketData);

    const { result } = renderHook(() => useSymbols());
    // Expect the hook to extract the IDs
    expect(result.current.symbols).toEqual(["bitcoin", "ethereum"]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("passes options to API hook", () => {
    const options = { staleTime: 1000 };
    setupMockApi([], { isLoading: true });
    renderHook(() => useSymbols(options));
    // Expect useMarkets to be called with undefined params (default) and the options
    expect(api.useMarkets).toHaveBeenCalledWith(undefined, options);
  });

  it("handles error state", () => {
    setupMockApi(null, { isError: true, error: new Error("fail") });
    const { result } = renderHook(() => useSymbols());
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
