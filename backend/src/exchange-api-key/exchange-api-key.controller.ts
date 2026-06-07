import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExchangeApiKeyService } from './exchange-api-key.service';
import { CreateExchangeApiKeyDto } from './dto/create-exchange-api-key.dto';
import { UserApiKey } from '../types/prisma.types';
import { User } from '../decorators/user.decorator';

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
    @User('user_id') userId: string,
    @Body() dto: CreateExchangeApiKeyDto,
  ): Promise<Partial<UserApiKey>> {
    return this.apiKeyService.addApiKey(userId, dto);
  }

  @Get()
  async listApiKeys(
    @User('user_id') userId: string,
  ): Promise<Partial<UserApiKey>[]> {
    return this.apiKeyService.listApiKeys(userId);
  }

  @Delete(':id')
  async deleteApiKey(
    @User('user_id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.apiKeyService.deleteApiKey(userId, id);
  }

  @Post(':id/test')
  async testApiKey(
    @User('user_id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.apiKeyService.testApiKey(userId, id);
  }
}
