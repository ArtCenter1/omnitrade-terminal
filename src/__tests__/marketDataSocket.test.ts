import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import MarketDataSocket from "../services/marketDataSocket";
import { Socket } from "socket.io-client";

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  return {
    io: vi.fn(),
    Socket: class {},
  };
});

describe("MarketDataSocket", () => {
  let mockSocket: any;
  let ioMock: any;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    ioMock = require("socket.io-client").io;
    ioMock.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("is a singleton", () => {
    const instance1 = MarketDataSocket;
    const instance2 = require("../services/marketDataSocket").default;
    expect(instance1).toBe(instance2);
  });

  it("connects and sets up event handlers", () => {
    MarketDataSocket.disconnect(); // Ensure clean state
    MarketDataSocket.connect();
    expect(ioMock).toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "connect_error",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("does not reconnect if already connected", () => {
    MarketDataSocket.disconnect();
    MarketDataSocket.connect();
    ioMock.mockClear();
    // Simulate already connected
    (MarketDataSocket as any).isConnected = true;
    MarketDataSocket.connect();
    expect(ioMock).not.toHaveBeenCalled();
    (MarketDataSocket as any).isConnected = false;
  });

  it("disconnects and cleans up", () => {
    MarketDataSocket.connect();
    MarketDataSocket.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect((MarketDataSocket as any).socket).toBeNull();
    expect((MarketDataSocket as any).isConnected).toBe(false);
  });

  it("subscribes and unsubscribes to channels", () => {
    MarketDataSocket.disconnect();
    MarketDataSocket.connect();
    MarketDataSocket.subscribe("BTCUSDT", "ticker");
    expect(mockSocket.emit).toHaveBeenCalledWith("message", {
      event: "subscribe",
      data: { type: "ticker", symbol: "BTCUSDT" },
    });

    MarketDataSocket.unsubscribe("BTCUSDT", "ticker");
    expect(mockSocket.emit).toHaveBeenCalledWith("message", {
      event: "unsubscribe",
      data: { type: "ticker", symbol: "BTCUSDT" },
    });
  });

  it("adds and removes message handlers", () => {
    const handler = vi.fn();
    MarketDataSocket.addMessageHandler(handler);
    expect((MarketDataSocket as any).handlers.has(handler)).toBe(true);
    MarketDataSocket.removeMessageHandler(handler);
    expect((MarketDataSocket as any).handlers.has(handler)).toBe(false);
  });

  it("calls handlers on valid message events", () => {
    const handler = vi.fn();
    MarketDataSocket.addMessageHandler(handler);
    const msg = {
      event: "ticker",
      data: { symbol: "BTCUSDT", price: "100", timestamp: 1 },
    };
    (MarketDataSocket as any).handleMessage(msg);
    expect(handler).toHaveBeenCalledWith(msg);
    MarketDataSocket.removeMessageHandler(handler);
  });

  it("ignores unknown message events", () => {
    const handler = vi.fn();
    MarketDataSocket.addMessageHandler(handler);
    const msg = { event: "unknown", data: {} };
    (MarketDataSocket as any).handleMessage(msg);
    expect(handler).not.toHaveBeenCalled();
    MarketDataSocket.removeMessageHandler(handler);
  });

  it("reconnects up to max attempts", async () => {
    MarketDataSocket.disconnect();
    (MarketDataSocket as any).reconnectAttempts = 4;
    (MarketDataSocket as any).maxReconnectAttempts = 5;
    const connectSpy = vi.spyOn(MarketDataSocket, "connect");
    (MarketDataSocket as any).tryReconnect();
    // Fast-forward timers
    vi.runAllTimers?.();
    expect(connectSpy).toHaveBeenCalled();
    (MarketDataSocket as any).reconnectAttempts = 0;
    connectSpy.mockRestore();
  });
});
