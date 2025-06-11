import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Returns user orders' })
  async getUserOrders(@Request() req, @Query('status') status?: string) {
    return this.ordersService.getUserOrders(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetails(@Request() req, @Param('id') orderId: string) {
    return this.ordersService.getOrderDetails(req.user.id, orderId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  async cancelOrder(@Request() req, @Param('id') orderId: string) {
    return this.ordersService.cancelOrder(req.user.id, orderId);
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Track order' })
  @ApiResponse({ status: 200, description: 'Returns tracking information' })
  async trackOrder(@Request() req, @Param('id') orderId: string) {
    return this.ordersService.trackOrder(req.user.id, orderId);
  }
}