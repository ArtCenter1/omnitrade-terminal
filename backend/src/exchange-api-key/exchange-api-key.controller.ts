import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExchangeApiKeyService } from './exchange-api-key.service';
import { CreateExchangeApiKeyDto } from './dto/create-exchange-api-key.dto';
import { Request as ExpressRequest } from 'express';
import { UserApiKey } from '../types/prisma.types';
/**
 * Controller for managing user exchange API keys.
 * Endpoints:
 *  - POST   /exchange-api-keys         Add a new exchange API key
 *  - GET    /exchange-api-keys         List all exchange API keys for the user
 *  - DELETE /exchange-api-keys/:id     Delete a specific exchange API key
 *  - POST   /exchange-api-keys/:id/test  Test the connection/credentials for a given API key
 */
@Controller('exchange-api-keys')
@UseGuards(JwtAuthGuard)
export class ExchangeApiKeyController {
  constructor(private readonly apiKeyService: ExchangeApiKeyService) {}

  @Post()
  async addApiKey(
    @Request() req: ExpressRequest & { user: { user_id: string } },
    @Body() dto: CreateExchangeApiKeyDto,
  ): Promise<Partial<UserApiKey>> {
    return this.apiKeyService.addApiKey(req.user.user_id, dto);
  }

  @Get()
  async listApiKeys(
    @Request() req: ExpressRequest & { user: { user_id: string } },
  ): Promise<Partial<UserApiKey>[]> {
    return this.apiKeyService.listApiKeys(req.user.user_id);
  }

  @Delete(':id')
  async deleteApiKey(
    @Request() req: ExpressRequest & { user: { user_id: string } },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.apiKeyService.deleteApiKey(req.user.user_id, id);
  }

  @Post(':id/test')
  async testApiKey(
    @Request() req: ExpressRequest & { user: { user_id: string } },
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.apiKeyService.testApiKey(req.user.user_id, id);
  }
}
