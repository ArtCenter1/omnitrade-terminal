import {
  Controller,
  Get,
  Request,
  UseGuards,
  Query,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { Portfolio } from '../types/exchange.types';

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
    @Request() req: ExpressRequest & { user: { user_id: string } },
    @Query('exchange_id') exchangeId?: string,
  ): Promise<Portfolio> {
    try {
      return await this.portfolioService.getAggregatedPortfolio(
        req.user.user_id,
        exchangeId,
      );
    } catch (error) {
      this.logger.error(
        `Error fetching portfolio for user ${req.user.user_id}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch portfolio data');
    }
  }
}
