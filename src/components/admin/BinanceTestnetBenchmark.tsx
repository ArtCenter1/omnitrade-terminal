// src/components/admin/BinanceTestnetBenchmark.tsx

import React, { useState, useEffect } from 'react';
import { BinanceTestnetBenchmarkAdapter } from '@/services/exchange/binanceTestnetBenchmarkAdapter';
import { useFeatureFlagsContext, setFeatureFlag } from '@/config/featureFlags';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BenchmarkResult {
  endpoint: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  successRate: number;
  avgResponseSize?: number;
  avgUsedWeight?: number;
}

const ENDPOINTS_TO_TEST = [
  {
    name: 'Order Book',
    symbol: 'BTC/USDT',
    limit: 100,
    method: 'getOrderBook',
    endpointName: 'orderBook',
  },
  {
    name: 'Recent Trades',
    symbol: 'BTC/USDT',
    limit: 50,
    method: 'getRecentTrades',
    endpointName: 'recentTrades',
  },
  {
    name: 'Ticker',
    symbol: 'BTC/USDT',
    method: 'getTickerStats',
    endpointName: 'tickerStats',
  },
  {
    name: 'Exchange Info',
    method: 'getExchangeInfo',
    endpointName: 'exchangeInfo',
  },
  {
    name: 'Trading Pairs',
    method: 'getTradingPairs',
    endpointName: 'tradingPairs',
  },
];

const BinanceTestnetBenchmark: React.FC = () => {
  const [adapter, setAdapter] = useState<BinanceTestnetBenchmarkAdapter | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, BenchmarkResult>>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkCompleted, setBenchmarkCompleted] = useState(false);
  const [requestsPerEndpoint, setRequestsPerEndpoint] = useState(10);

  // Get feature flags and connection status
  const featureFlags = useFeatureFlagsContext();
  const { getStatus, checkConnection } = useConnectionStatus();

  // Initialize the adapter
  useEffect(() => {
    try {
      // Check if Binance Testnet is enabled
      if (!featureFlags.useBinanceTestnet) {
        setError(
          'Binance Testnet is disabled. Please enable it in Developer Settings to use the benchmark tool.',
        );
        return;
      }

      const benchmarkAdapter = new BinanceTestnetBenchmarkAdapter();
      setAdapter(benchmarkAdapter);

      // Log initialization
      console.log('BinanceTestnetBenchmark: Adapter initialized successfully');

      // Check connection status
      checkConnection('binance_testnet').then(() => {
        const connectionStatus = getStatus('binance_testnet');
        if (connectionStatus.status !== 'connected') {
          console.warn(
            'Binance Testnet is not connected. Benchmarks may not work correctly.',
          );
        } else if (connectionStatus.type === 'mock') {
          console.warn(
            'Using mock data for Binance Testnet. Benchmark results will not reflect actual API performance.',
          );
        } else {
          console.log(
            'Binance Testnet connection verified. Ready to run benchmarks.',
          );
        }
      });
    } catch (err) {
      console.error('Error initializing benchmark adapter:', err);
      setError(
        `Failed to initialize benchmark adapter: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }, [featureFlags.useBinanceTestnet, checkConnection, getStatus]);

  // Format duration in milliseconds
  const formatDuration = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  // Format bytes
  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Run a single benchmark for an endpoint
  const runSingleBenchmark = async (
    endpoint: {
      name: string;
      symbol?: string;
      limit?: number;
      method: string;
      endpointName: string;
    },
    iterations: number,
  ): Promise<void> => {
    if (!adapter) return;

    setError(null);

    try {
      console.log(
        `Starting benchmark for ${endpoint.name} (${iterations} iterations)...`,
      );

      // Clear previous logs for this endpoint
      adapter.clearPerformanceLogs();
      console.log(`Cleared performance logs for ${endpoint.name}`);

      // Run the benchmark
      for (let i = 0; i < iterations; i++) {
        try {
          console.log(`${endpoint.name} - Iteration ${i + 1}/${iterations}`);

          if (endpoint.method === 'getOrderBook' && endpoint.symbol) {
            console.log(
              `Calling getOrderBook for ${endpoint.symbol} with limit ${endpoint.limit || 'default'}`,
            );
            await adapter.getOrderBook(endpoint.symbol, endpoint.limit);
          } else if (endpoint.method === 'getRecentTrades' && endpoint.symbol) {
            console.log(
              `Calling getRecentTrades for ${endpoint.symbol} with limit ${endpoint.limit || 'default'}`,
            );
            await adapter.getRecentTrades(endpoint.symbol, endpoint.limit);
          } else if (endpoint.method === 'getTickerStats' && endpoint.symbol) {
            console.log(`Calling getTickerStats for ${endpoint.symbol}`);
            await adapter.getTickerStats(endpoint.symbol);
          } else if (endpoint.method === 'getExchangeInfo') {
            console.log('Calling getExchangeInfo');
            await adapter.getExchangeInfo();
          } else if (endpoint.method === 'getTradingPairs') {
            console.log('Calling getTradingPairs');
            await adapter.getTradingPairs();
          }

          // Update progress
          setProgress((prevProgress) => {
            const newProgress =
              prevProgress + 100 / (ENDPOINTS_TO_TEST.length * iterations);
            return Math.min(newProgress, 100);
          });

          // Small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          console.error(
            `Error in benchmark iteration ${i + 1}/${iterations} for ${endpoint.name}:`,
            err,
          );
          // Continue with next iteration
        }
      }

      // Get stats for this endpoint
      console.log(`Getting performance stats for ${endpoint.endpointName}...`);
      const stats = adapter.getPerformanceStats(endpoint.endpointName);
      console.log(`Stats for ${endpoint.endpointName}:`, stats);

      // Check if we have any data
      if (stats.count === 0) {
        console.warn(
          `No data collected for ${endpoint.name}. All requests may have failed.`,
        );
      } else {
        console.log(
          `Successfully collected data for ${stats.count} requests to ${endpoint.name}`,
        );
      }

      // Update results
      setResults((prevResults) => ({
        ...prevResults,
        [endpoint.name]: stats,
      }));
    } catch (err) {
      console.error(`Error running benchmark for ${endpoint.name}:`, err);
      setError(
        `Failed to run benchmark for ${endpoint.name}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  };

  // Run all benchmarks
  const runBenchmarks = async (): Promise<void> => {
    if (!adapter) {
      setError('Benchmark adapter not initialized');
      return;
    }

    // Check if Binance Testnet is enabled
    if (!featureFlags.useBinanceTestnet) {
      setError(
        'Binance Testnet is disabled. Please enable it in Developer Settings to use the benchmark tool.',
      );
      return;
    }

    // Check connection status
    const connectionStatus = getStatus('binance_testnet');
    if (connectionStatus.status !== 'connected') {
      setError(
        'Binance Testnet is not connected. Please check the connection before running benchmarks.',
      );
      await checkConnection('binance_testnet');
      return;
    }

    // Check if using mock data
    if (connectionStatus.type === 'mock') {
      setError(
        'Using mock data for Binance Testnet. Benchmark results will not reflect actual API performance.',
      );
    }

    console.log('Starting benchmark run...');
    setLoading(true);
    setBenchmarkRunning(true);
    setBenchmarkCompleted(false);
    setProgress(0);
    setResults({});
    setError(null);
    setSuccess(null);

    try {
      // Clear any existing logs
      adapter.clearPerformanceLogs();
      console.log('Performance logs cleared');

      // Run benchmarks for each endpoint
      for (const endpoint of ENDPOINTS_TO_TEST) {
        console.log(`Running benchmark for ${endpoint.name}...`);
        await runSingleBenchmark(endpoint, requestsPerEndpoint);
      }

      // Get overall stats
      console.log('Getting overall stats...');
      const overallStats = adapter.getPerformanceStats();
      console.log('Overall stats:', overallStats);

      // Update results with overall stats
      setResults((prevResults) => ({
        ...prevResults,
        Overall: overallStats,
      }));

      // Check if we have any results
      const totalRequests = overallStats.count || 0;
      if (totalRequests === 0) {
        console.warn(
          'No benchmark data collected. This may indicate a connection issue.',
        );
        setError(
          'No benchmark data collected. This may indicate a connection issue with Binance Testnet.',
        );
      } else {
        setSuccess(
          `Benchmarks completed successfully. Collected data for ${totalRequests} requests.`,
        );
        setBenchmarkCompleted(true);
      }
    } catch (err) {
      console.error('Error running benchmarks:', err);
      setError(
        `Failed to run benchmarks: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
      setBenchmarkRunning(false);
      setProgress(100);
    }
  };

  // Export results as JSON
  const exportResults = (): void => {
    if (!adapter) return;

    try {
      const logs = adapter.exportPerformanceLogs();

      // Create a blob and download it
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `binance-testnet-benchmark-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting results:', err);
      setError('Failed to export results');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Binance Testnet Benchmark</CardTitle>
        <CardDescription>
          Run performance benchmarks for Binance Testnet API endpoints
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>

            {error.includes('Binance Testnet is disabled') && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFeatureFlag('useBinanceTestnet', true);
                    setError(null);
                  }}
                >
                  Enable Binance Testnet
                </Button>
                <p className="text-xs mt-2">
                  This will enable Binance Testnet in the Developer Settings.
                </p>
              </div>
            )}
          </Alert>
        )}

        {success && (
          <Alert
            variant="default"
            className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
            <div>
              <h3 className="text-sm font-medium">
                Binance Testnet Connection Status
              </h3>
              <div className="flex items-center mt-1">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    getStatus('binance_testnet').status === 'connected'
                      ? 'bg-green-500'
                      : getStatus('binance_testnet').status === 'connecting'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm">
                  {getStatus('binance_testnet').status === 'connected'
                    ? 'Connected'
                    : getStatus('binance_testnet').status === 'connecting'
                      ? 'Connecting...'
                      : 'Disconnected'}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {getStatus('binance_testnet').type === 'mock'
                    ? '(Using Mock Data)'
                    : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last checked:{' '}
                {new Date(
                  getStatus('binance_testnet').lastChecked,
                ).toLocaleTimeString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkConnection('binance_testnet')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Requests per endpoint
              </label>
              <Select
                value={requestsPerEndpoint.toString()}
                onValueChange={(value) =>
                  setRequestsPerEndpoint(parseInt(value))
                }
                disabled={benchmarkRunning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of requests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 requests</SelectItem>
                  <SelectItem value="10">10 requests</SelectItem>
                  <SelectItem value="20">20 requests</SelectItem>
                  <SelectItem value="50">50 requests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runBenchmarks}
              disabled={
                !adapter ||
                benchmarkRunning ||
                getStatus('binance_testnet').status !== 'connected'
              }
              className="mt-auto"
            >
              {benchmarkRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Benchmarks'
              )}
            </Button>

            <Button
              onClick={exportResults}
              disabled={!adapter || !benchmarkCompleted}
              variant="outline"
              className="mt-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </div>

          {benchmarkRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {Object.keys(results).length > 0 && (
            <div className="mt-6">
              <Tabs
                defaultValue="all"
                value={selectedEndpoint}
                onValueChange={setSelectedEndpoint}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Overall</TabsTrigger>
                  {ENDPOINTS_TO_TEST.map((endpoint) => (
                    <TabsTrigger key={endpoint.name} value={endpoint.name}>
                      {endpoint.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Avg (ms)</TableHead>
                        <TableHead>Min (ms)</TableHead>
                        <TableHead>Max (ms)</TableHead>
                        <TableHead>p95 (ms)</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Avg Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(results).map(([endpoint, result]) => (
                        <TableRow key={endpoint}>
                          <TableCell>{endpoint}</TableCell>
                          <TableCell>{result.count}</TableCell>
                          <TableCell>
                            {formatDuration(result.avgDuration)}
                          </TableCell>
                          <TableCell>
                            {formatDuration(result.minDuration)}
                          </TableCell>
                          <TableCell>
                            {formatDuration(result.maxDuration)}
                          </TableCell>
                          <TableCell>
                            {formatDuration(result.p95Duration)}
                          </TableCell>
                          <TableCell>
                            {result.successRate.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            {formatBytes(result.avgResponseSize)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {ENDPOINTS_TO_TEST.map((endpoint) => (
                  <TabsContent key={endpoint.name} value={endpoint.name}>
                    {results[endpoint.name] ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-sm font-medium">
                                Average Response Time
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-2xl font-bold">
                                {formatDuration(
                                  results[endpoint.name].avgDuration,
                                )}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-sm font-medium">
                                p95 Response Time
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-2xl font-bold">
                                {formatDuration(
                                  results[endpoint.name].p95Duration,
                                )}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-sm font-medium">
                                Success Rate
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-2xl font-bold">
                                {results[endpoint.name].successRate.toFixed(1)}%
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-sm font-medium">
                                Avg Response Size
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-2xl font-bold">
                                {formatBytes(
                                  results[endpoint.name].avgResponseSize,
                                )}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Requests</TableCell>
                              <TableCell>
                                {results[endpoint.name].count}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Min Response Time</TableCell>
                              <TableCell>
                                {formatDuration(
                                  results[endpoint.name].minDuration,
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Max Response Time</TableCell>
                              <TableCell>
                                {formatDuration(
                                  results[endpoint.name].maxDuration,
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>p50 Response Time</TableCell>
                              <TableCell>
                                {formatDuration(
                                  results[endpoint.name].p50Duration,
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>p99 Response Time</TableCell>
                              <TableCell>
                                {formatDuration(
                                  results[endpoint.name].p99Duration,
                                )}
                              </TableCell>
                            </TableRow>
                            {results[endpoint.name].avgUsedWeight !==
                              undefined && (
                              <TableRow>
                                <TableCell>Avg Used Weight</TableCell>
                                <TableCell>
                                  {results[endpoint.name].avgUsedWeight.toFixed(
                                    1,
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No data available for this endpoint
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Note: These benchmarks measure client-side performance and network
          latency. Server-side processing time may vary.
        </p>
      </CardFooter>
    </Card>
  );
};

export default BinanceTestnetBenchmark;
