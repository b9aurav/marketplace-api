import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminAuditInterceptor } from '../interceptors/admin-audit.interceptor';
import { OrderManagementService } from '../services/order-management.service';
import {
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  ProcessRefundDto,
  OrderAnalyticsQueryDto,
  PaginatedOrdersDto,
  OrderDetailsDto,
  OrderAnalyticsDto,
  RefundResultDto,
} from '../dto/order-management.dto';

@ApiTags('Admin - Order Management')
@Controller('api/admin/orders')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@ApiBearerAuth()
export class OrderManagementController {
  constructor(private readonly orderManagementService: OrderManagementService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get orders list with filtering and pagination',
    description: 'Retrieve a paginated list of orders with comprehensive filtering options including search, status, user, payment method, amount range, and date range.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: PaginatedOrdersDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by order ID, user email, or tracking number' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'payment_method', required: false, description: 'Filter by payment method' })
  @ApiQuery({ name: 'min_total', required: false, description: 'Minimum order total' })
  @ApiQuery({ name: 'max_total', required: false, description: 'Maximum order total' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'sort_by', required: false, description: 'Sort field (default: created_at)' })
  @ApiQuery({ name: 'sort_order', required: false, description: 'Sort order (default: desc)' })
  async getOrders(@Query() query: GetOrdersQueryDto): Promise<PaginatedOrdersDto> {
    return this.orderManagementService.getOrders(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get order details',
    description: 'Retrieve detailed information about a specific order including items, user, address, and tracking information.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order details retrieved successfully',
    type: OrderDetailsDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetails(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<OrderDetailsDto> {
    return this.orderManagementService.getOrderDetails(id);
  }

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Update order status',
    description: 'Update the status of an order with optional admin notes and tracking number. Status transitions are validated.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Order status updated successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: UpdateOrderStatusDto
  ): Promise<{ message: string }> {
    await this.orderManagementService.updateOrderStatus(id, updateData);
    return { message: 'Order status updated successfully' };
  }

  @Post(':id/refund')
  @ApiOperation({ 
    summary: 'Process order refund',
    description: 'Process a full or partial refund for an order through the payment gateway. Only eligible orders can be refunded.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Refund processed successfully',
    type: RefundResultDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid refund amount or order not eligible' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() refundData: ProcessRefundDto
  ): Promise<RefundResultDto> {
    return this.orderManagementService.processRefund(id, refundData);
  }

  @Get('analytics/overview')
  @ApiOperation({ 
    summary: 'Get order analytics',
    description: 'Retrieve comprehensive order analytics including totals, trends, status distribution, payment methods, and growth metrics for a specified date range.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order analytics retrieved successfully',
    type: OrderAnalyticsDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid date range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiQuery({ name: 'date_from', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'interval', required: false, description: 'Grouping interval (day, week, month)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by specific status' })
  async getOrderAnalytics(@Query() query: OrderAnalyticsQueryDto): Promise<OrderAnalyticsDto> {
    return this.orderManagementService.getOrderAnalytics(query);
  }
}