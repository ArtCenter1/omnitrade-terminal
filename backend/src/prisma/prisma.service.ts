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
  // Unused variable to test ESLint
  private unusedVar = 'test';

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
    } catch (error) {
      // Define a type guard for error objects with a message property
      const isErrorWithMessage = (err: unknown): err is { message: string } => {
        return (
          typeof err === 'object' &&
          err !== null &&
          'message' in err &&
          typeof (err as { message: unknown }).message === 'string'
        );
      };

      if (
        isErrorWithMessage(error) &&
        (error.message.includes('did not initialize yet') ||
          error.message.includes('run "prisma generate"'))
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
        } catch (genError) {
          const errorMessage = isErrorWithMessage(genError)
            ? genError.message
            : 'Unknown error';

          this.logger.error(
            `Failed to generate Prisma client: ${errorMessage}`,
          );
          throw genError;
        }
      } else {
        const errorMessage = isErrorWithMessage(error)
          ? error.message
          : 'Unknown error';

        this.logger.error(`Failed to connect to Prisma: ${errorMessage}`);
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected successfully');
  }
}
