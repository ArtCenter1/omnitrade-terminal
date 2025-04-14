import React from "react";
import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import * as api from "../services/marketDataApi";
import { useSymbols } from "../hooks/useSymbols";

// Mock the API hook
vi.mock("../services/marketDataApi", () => ({
  useSymbols: vi.fn(),
}));

function setupMockApi(data: any, overrides: any = {}) {
  (api.useSymbols as any).mockReturnValue({
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
    const symbols = [{ symbol: "BTCUSDT" }, { symbol: "ETHUSDT" }];
    setupMockApi(symbols);

    const { result } = renderHook(() => useSymbols());
    expect(result.current.symbols).toEqual(symbols);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("passes options to API hook", () => {
    const options = { staleTime: 1000 };
    setupMockApi([], { isLoading: true });
    renderHook(() => useSymbols(options));
    expect(api.useSymbols).toHaveBeenCalledWith(options);
  });

  it("handles error state", () => {
    setupMockApi(null, { isError: true, error: new Error("fail") });
    const { result } = renderHook(() => useSymbols());
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});