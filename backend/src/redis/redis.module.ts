import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Make this module global so the service is available everywhere
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
