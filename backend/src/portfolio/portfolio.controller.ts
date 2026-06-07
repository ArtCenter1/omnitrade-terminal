import {
  Controller,
  Get,
  UseGuards,
  Query,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Portfolio } from '../types/exchange.types';
import { User } from '../decorators/user.decorator';

/**
 * Controller for portfolio-related endpoints.
 * Endpoints:
 *  - GET /portfolio - Get aggregated portfolio data from all connected exchanges
 */
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  private readonly logger = new Logger(PortfolioController.name);

  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  async getPortfolio(
    @User('user_id') userId: string,
    @Query('exchange_id') exchangeId?: string,
  ): Promise<Portfolio> {
    try {
      return await this.portfolioService.getAggregatedPortfolio(
        userId,
        exchangeId,
      );
    } catch (error) {
      this.logger.error(`Error fetching portfolio for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to fetch portfolio data');
    }
  }
}
