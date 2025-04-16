import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Exchange, UserApiKey } from '../types/prisma.types';

@Injectable()
export class TypedPrismaService {
  constructor(private prisma: PrismaService) {}

  get exchange() {
    return {
      findUnique: async (args: any): Promise<Exchange | null> => {
        return this.prisma.exchange.findUnique(args) as Promise<Exchange | null>;
      },
    };
  }

  get userApiKey() {
    return {
      findFirst: async (args: any): Promise<UserApiKey | null> => {
        return this.prisma.userApiKey.findFirst(args) as Promise<UserApiKey | null>;
      },
      findUnique: async (args: any): Promise<UserApiKey | null> => {
        return this.prisma.userApiKey.findUnique(args) as Promise<UserApiKey | null>;
      },
      findMany: async (args: any): Promise<UserApiKey[]> => {
        return this.prisma.userApiKey.findMany(args) as Promise<UserApiKey[]>;
      },
      create: async (args: any): Promise<UserApiKey> => {
        return this.prisma.userApiKey.create(args) as Promise<UserApiKey>;
      },
      delete: async (args: any): Promise<UserApiKey> => {
        return this.prisma.userApiKey.delete(args) as Promise<UserApiKey>;
      },
    };
  }
}
