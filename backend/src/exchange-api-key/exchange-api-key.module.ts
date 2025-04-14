import { Module } from '@nestjs/common';
import { ExchangeApiKeyController } from './exchange-api-key.controller';
import { ExchangeApiKeyService } from './exchange-api-key.service';

@Module({
  controllers: [ExchangeApiKeyController],
  providers: [ExchangeApiKeyService],
  exports: [ExchangeApiKeyService],
})
export class ExchangeApiKeyModule {}
