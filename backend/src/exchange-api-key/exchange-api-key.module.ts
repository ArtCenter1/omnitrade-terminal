import { Module } from '@nestjs/common';
import { ExchangeApiKeyController } from './exchange-api-key.controller';
import { ExchangeApiKeyService } from './exchange-api-key.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ExchangeApiKeyController],
  providers: [ExchangeApiKeyService, PrismaService],
  exports: [ExchangeApiKeyService],
})
export class ExchangeApiKeyModule {}
