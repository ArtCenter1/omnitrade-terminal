# Rate Limiting Implementation for Binance Testnet Integration

## Overview

This document describes the implementation of rate limiting for the Binance Testnet integration, including WebSocket fallback mechanisms to reduce API usage and prevent rate limit bans.

## Key Components

1. **RateLimitManager**: Singleton class that tracks and manages API rate limits
2. **WebSocket Integration**: Fallback mechanism for real-time data
3. **UI Components**: Status indicators and controls for rate limiting

## Rate Limit Thresholds

The system implements two threshold levels:

1. **Warning Threshold (70%)**: When API usage reaches 70% of the limit, the system displays warnings and suggests using WebSocket for real-time data.
2. **Safety Threshold (90%)**: When API usage reaches 90% of the limit, the system enforces WebSocket-only mode for non-critical operations to prevent rate limiting.

## WebSocket Preference

The system includes a preference setting to prioritize WebSocket connections over REST API calls for real-time data:

- When enabled, the system will attempt to use WebSocket for supported endpoints before falling back to REST API.
- This setting can be toggled by users through the UI.

## Supported WebSocket Endpoints

The following endpoints support WebSocket fallback:

- Ticker data (`/v3/ticker/24hr`)
- Order book data (`/v3/depth`)
- Recent trades (`/v3/trades`)
- Klines/candlestick data (`/v3/klines`)

## Implementation Details

### RateLimitManager

The `RateLimitManager` class has been enhanced with:

- Threshold tracking and notification
- WebSocket preference setting
- Queue management with priority for WebSocket
- Automatic fallback mechanisms

### BinanceTestnetAdapter

The `BinanceTestnetAdapter` class has been updated to:

- Check for WebSocket availability for each endpoint
- Format symbols correctly for WebSocket
- Handle WebSocket data retrieval and caching
- Implement fallback mechanisms for API failures

### API Request Flow

1. Request is initiated through `makeUnauthenticatedRequest`
2. System checks if WebSocket is available for the endpoint
3. If WebSocket is preferred or thresholds are reached, attempt WebSocket first
4. Fall back to REST API if WebSocket fails or is unavailable
5. Track rate limit usage from response headers
6. Update thresholds and notify listeners if thresholds are crossed

## UI Components

A new `RateLimitStatus` component has been added to display:

- Current API usage percentage
- Time until rate limit reset
- Warning and error messages for threshold breaches
- Toggle for WebSocket preference

## Testing

Unit tests have been added to verify:

- Threshold calculations and updates
- Request denial when safety threshold is reached
- WebSocket preference behavior
- Fallback mechanisms

## Best Practices

1. **Use WebSocket for Real-Time Data**: Enable WebSocket preference for optimal performance and to avoid rate limiting.
2. **Monitor Rate Limit Status**: Keep an eye on the rate limit indicator in the UI.
3. **Handle Rate Limit Errors**: The system will automatically handle most rate limit issues, but be aware of potential service degradation during high usage.
4. **Force REST for Critical Operations**: Use the `forceRest` option for critical operations that must use REST API.

## Future Improvements

1. **Enhanced Caching**: Implement more sophisticated caching to further reduce API calls.
2. **Dynamic Thresholds**: Adjust thresholds based on usage patterns and time of day.
3. **Multi-User Rate Limit Pooling**: Implement shared rate limit pools for multi-user environments.
4. **Offline Mode**: Add support for fully offline operation using cached data when rate limited.
