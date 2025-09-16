import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Get user orders" })
  @ApiResponse({ status: 200, description: "Returns user orders" })
  async getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order details" })
  @ApiResponse({ status: 200, description: "Returns order details" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderDetails(@Request() req, @Param("id") orderId: string) {
    const result = await this.ordersService.getOrderDetails(
      req.user.id,
      orderId,
    );
    return result.order;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  async createOrder(@Request() req, @Body() createOrderDto: any) {
    const result = await this.ordersService.createOrder(
      req.user.id,
      createOrderDto,
    );
    return result.order;
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel an order" })
  @ApiResponse({ status: 200, description: "Order cancelled successfully" })
  async cancelOrder(@Request() req, @Param("id") id: string) {
    return this.ordersService.cancelOrder(req.user.id, id);
  }

  @Get(":id/track")
  @ApiOperation({ summary: "Track an order" })
  @ApiResponse({ status: 200, description: "Returns order tracking info" })
  async trackOrder(@Request() req, @Param("id") id: string) {
    const result = await this.ordersService.trackOrder(req.user.id, id);
    return result.order;
  }
}
