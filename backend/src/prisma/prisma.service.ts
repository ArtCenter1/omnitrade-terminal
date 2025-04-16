import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Pass the path to the schema file
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully');
    } catch (error: any) {
      if (
        (error.message && error.message.includes('did not initialize yet')) ||
        (error.message && error.message.includes('run "prisma generate"'))
      ) {
        this.logger.warn(
          'Prisma client not initialized. Running prisma generate...',
        );
        try {
          const { stdout } = await execPromise('npx prisma generate');
          this.logger.log('Prisma client generated successfully');
          this.logger.debug(stdout);

          // Try connecting again
          await this.$connect();
          this.logger.log('Prisma connected successfully after generation');
        } catch (genError: any) {
          this.logger.error(
            `Failed to generate Prisma client: ${genError.message}`,
          );
          throw genError;
        }
      } else {
        this.logger.error(`Failed to connect to Prisma: ${error.message}`);
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected successfully');
  }
}
