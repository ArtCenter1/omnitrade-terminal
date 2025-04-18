import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { OrdersService, Order, CreateOrderDto } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../decorators/user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async placeOrder(
    @User('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    this.logger.log(`Request to place order for user ${userId}`);
    return this.ordersService.placeOrder(userId, createOrderDto);
  }

  @Get()
  async getOrders(
    @User('userId') userId: string,
    @Query('exchangeId') exchangeId?: string,
    @Query('symbol') symbol?: string,
    @Query('status') status?: string,
  ): Promise<Order[]> {
    this.logger.log(`Request for orders of user ${userId}`);
    return this.ordersService.getOrders(userId, exchangeId, symbol, status);
  }

  @Get(':orderId')
  async getOrder(
    @User('userId') userId: string,
    @Param('orderId') orderId: string,
  ): Promise<Order> {
    this.logger.log(`Request for order ${orderId} of user ${userId}`);
    return this.ordersService.getOrder(userId, orderId);
  }

  @Delete(':orderId')
  async cancelOrder(
    @User('userId') userId: string,
    @Param('orderId') orderId: string,
  ): Promise<Order> {
    this.logger.log(`Request to cancel order ${orderId} for user ${userId}`);
    return this.ordersService.cancelOrder(userId, orderId);
  }
}
