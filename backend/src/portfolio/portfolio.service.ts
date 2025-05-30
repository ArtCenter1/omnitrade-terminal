import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Portfolio, PortfolioAsset } from '../types/exchange.types';
import * as crypto from 'crypto';
import { UserApiKey } from '../types/prisma.types';

// Mock data service for development
class MockDataService {
  generatePortfolio(exchangeId: string, seed?: number): Portfolio {
    // Use a consistent seed for reproducible results if provided
    const random =
      seed !== undefined
        ? () => {
            // Simple deterministic random function using the seed
            seed = (seed! * 9301 + 49297) % 233280;
            return seed / 233280;
          }
        : Math.random;

    // Generate between 5 and 15 assets
    const assetCount = Math.floor(random() * 10) + 5;
    const assets: PortfolioAsset[] = [];
    let totalUsdValue = 0;

    // Common crypto assets
    const commonAssets = [
      'BTC',
      'ETH',
      'SOL',
      'ADA',
      'DOT',
      'LINK',
      'XRP',
      'LTC',
      'BCH',
      'XLM',
      'DOGE',
      'AVAX',
      'MATIC',
      'UNI',
      'AAVE',
      'SNX',
      'COMP',
      'MKR',
      'YFI',
      'SUSHI',
    ];

    // Generate assets
    for (let i = 0; i < assetCount; i++) {
      // Select a random asset
      const asset = commonAssets[Math.floor(random() * commonAssets.length)];

      // Generate random amounts
      const free = parseFloat((random() * 10).toFixed(8));
      const locked = parseFloat((random() * 2).toFixed(8));
      const total = free + locked;

      // Generate a random USD price between $1 and $50,000
      const price = parseFloat((random() * 49999 + 1).toFixed(2));
      const usdValue = parseFloat((total * price).toFixed(2));

      totalUsdValue += usdValue;

      assets.push({
        asset,
        free,
        locked,
        total,
        usdValue,
        exchangeId,
      });
    }

    return {
      totalUsdValue: parseFloat(totalUsdValue.toFixed(2)),
      assets,
      lastUpdated: new Date(),
    };
  }
}

// WARNING: For demo only. Use a secure key management system in production!
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update('super_secret_key')
  .digest(); // 32 bytes
const IV = Buffer.alloc(16, 0); // 16 bytes IV (all zeros for demo)

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly mockDataService = new MockDataService();

  constructor(private prisma: PrismaService) {}

  /**
   * Get aggregated portfolio data from all connected exchanges for a user.
   * If exchangeId is provided, only return data for that exchange.
   */
  async getAggregatedPortfolio(
    userId: string,
    exchangeId?: string,
  ): Promise<Portfolio> {
    // Get all API keys for the user (or for a specific exchange if exchangeId is provided)
    const apiKeys = await this.prisma.userApiKey.findMany({
      where: {
        user_id: userId,
        ...(exchangeId ? { exchange_id: exchangeId } : {}),
      },
      select: {
        api_key_id: true,
        exchange_id: true,
        api_key_encrypted: true,
        api_secret_encrypted: true,
      },
    });

    if (apiKeys.length === 0) {
      // Return empty portfolio if no API keys found
      return {
        totalUsdValue: 0,
        assets: [],
        lastUpdated: new Date(),
      };
    }

    // In a real implementation, we would:
    // 1. Decrypt API keys and secrets
    // 2. Use them to fetch real portfolio data from exchanges
    // 3. Aggregate the data

    // For now, we'll use mock data
    const portfolios: Portfolio[] = [];

    for (const key of apiKeys) {
      // Generate a seed from the API key ID for consistent results
      const seed =
        parseInt((key as UserApiKey).api_key_id.replace(/[^0-9]/g, '')) ||
        undefined;

      // Generate mock portfolio data
      const portfolio = this.mockDataService.generatePortfolio(
        (key as UserApiKey).exchange_id,
        seed,
      );

      portfolios.push(portfolio);
    }

    // Aggregate portfolios
    return this.aggregatePortfolios(portfolios, exchangeId);
  }

  /**
   * Aggregate multiple portfolios into a single portfolio.
   * @param portfolios The portfolios to aggregate
   * @param exchangeId Optional exchange ID to filter by
   */
  private aggregatePortfolios(
    portfolios: Portfolio[],
    exchangeId?: string,
  ): Portfolio {
    if (portfolios.length === 0) {
      return {
        totalUsdValue: 0,
        assets: [],
        lastUpdated: new Date(),
      };
    }

    // Use the most recent lastUpdated date
    const lastUpdated = portfolios.reduce(
      (latest, portfolio) =>
        portfolio.lastUpdated > latest ? portfolio.lastUpdated : latest,
      portfolios[0].lastUpdated,
    );

    // Check if we're aggregating for a specific exchange or for all exchanges
    const isPortfolioTotal = !exchangeId; // If no exchangeId is provided, we're aggregating all exchanges

    let totalUsdValue = 0;
    let aggregatedAssets: PortfolioAsset[] = [];

    if (isPortfolioTotal) {
      // For Portfolio Total, combine assets by symbol across exchanges
      const assetsBySymbol: Record<string, PortfolioAsset[]> = {};

      // First collect all assets grouped by symbol
      for (const portfolio of portfolios) {
        for (const asset of portfolio.assets) {
          if (!assetsBySymbol[asset.asset]) {
            assetsBySymbol[asset.asset] = [];
          }
          assetsBySymbol[asset.asset].push(asset);
        }

        totalUsdValue += portfolio.totalUsdValue;
      }

      // Then combine assets of the same symbol
      Object.entries(assetsBySymbol).forEach(([symbol, assets]) => {
        if (assets.length === 1) {
          // If there's only one asset with this symbol, use it directly
          aggregatedAssets.push({
            ...assets[0],
            exchangeSources: [
              { exchangeId: assets[0].exchangeId, amount: assets[0].total },
            ],
          });
        } else {
          // Combine multiple assets with the same symbol
          const totalFree = assets.reduce((sum, asset) => sum + asset.free, 0);
          const totalLocked = assets.reduce(
            (sum, asset) => sum + asset.locked,
            0,
          );
          const totalAmount = assets.reduce(
            (sum, asset) => sum + asset.total,
            0,
          );
          const totalValue = assets.reduce(
            (sum, asset) => sum + asset.usdValue,
            0,
          );

          // Use the first asset as a template
          const combinedAsset: PortfolioAsset = {
            ...assets[0],
            free: totalFree,
            locked: totalLocked,
            total: totalAmount,
            usdValue: totalValue,
            // Store sources for the trade function
            exchangeSources: assets.map((asset) => ({
              exchangeId: asset.exchangeId,
              amount: asset.total,
            })),
          };

          aggregatedAssets.push(combinedAsset);
        }
      });
    } else {
      // For individual exchanges, keep assets separate by exchange
      const assetMap = new Map<string, PortfolioAsset>();

      for (const portfolio of portfolios) {
        for (const asset of portfolio.assets) {
          // Use both asset symbol and exchange ID as the key to prevent combining assets across exchanges
          const key = `${asset.asset}-${asset.exchangeId}`;

          if (assetMap.has(key)) {
            // Update existing asset
            const existing = assetMap.get(key)!;
            existing.free += asset.free;
            existing.locked += asset.locked;
            existing.total += asset.total;
            existing.usdValue += asset.usdValue;
          } else {
            // Add new asset
            assetMap.set(key, { ...asset });
          }
        }

        totalUsdValue += portfolio.totalUsdValue;
      }

      aggregatedAssets = Array.from(assetMap.values());
    }

    return {
      totalUsdValue,
      assets: aggregatedAssets,
      lastUpdated,
    };
  }
}
