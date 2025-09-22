import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
  IsNumber,
  IsPositive,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "../../orders/entities/order.entity";

export class GetOrdersQueryDto {
  @ApiPropertyOptional({ description: "Page number", minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Search by order ID, user email, or tracking number",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: "Filter by order status",
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: "Filter by user ID" })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: "Filter by payment method" })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ description: "Minimum order total" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  min_total?: number;

  @ApiPropertyOptional({ description: "Maximum order total" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  max_total?: number;

  @ApiPropertyOptional({ description: "Start date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: "End date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    enum: ["created_at", "updated_at", "total", "status"],
    description: "Sort field",
    default: "created_at",
  })
  @IsOptional()
  @IsEnum(["created_at", "updated_at", "total", "status"])
  sort_by?: string = "created_at";

  @ApiPropertyOptional({
    enum: ["asc", "desc"],
    description: "Sort order",
    default: "desc",
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sort_order?: string = "desc";
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: "New order status" })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: "Admin notes for status change" })
  @IsOptional()
  @IsString()
  admin_notes?: string;

  @ApiPropertyOptional({ description: "Tracking number (for shipped status)" })
  @IsOptional()
  @IsString()
  tracking_number?: string;
}

export class ProcessRefundDto {
  @ApiProperty({ description: "Refund amount", minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: "Reason for refund" })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: "Admin notes for refund" })
  @IsOptional()
  @IsString()
  admin_notes?: string;

  @ApiPropertyOptional({
    description: "Notify customer via email",
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  notify_customer?: boolean = true;
}

export class OrderAnalyticsQueryDto {
  @ApiProperty({ description: "Start date (YYYY-MM-DD)" })
  @IsDateString()
  date_from: string;

  @ApiProperty({ description: "End date (YYYY-MM-DD)" })
  @IsDateString()
  date_to: string;

  @ApiPropertyOptional({
    enum: ["day", "week", "month"],
    description: "Grouping interval",
    default: "day",
  })
  @IsOptional()
  @IsEnum(["day", "week", "month"])
  interval?: string = "day";

  @ApiPropertyOptional({ description: "Filter by specific status" })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

// Response DTOs
export class OrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  product_id: string;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  product?: {
    id: string;
    name: string;
    images: string[];
    sku?: string;
  };
}

export class OrderUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  phone?: string;
}

export class OrderAddressDto {
  @ApiProperty()
  street: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zip: string;
}

export class OrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({ type: OrderUserDto })
  user: OrderUserDto;

  @ApiProperty()
  address_id: string;

  @ApiProperty({ type: OrderAddressDto })
  address: OrderAddressDto;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  tracking_number?: string;

  @ApiProperty({ required: false })
  payment_method?: string;

  @ApiProperty({ required: false })
  transaction_id?: string;

  @ApiProperty({ required: false })
  coupon_code?: string;

  @ApiProperty()
  discount_amount: number;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PaginatedOrdersDto {
  @ApiProperty({ type: [OrderDto] })
  orders: OrderDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;
}

export class OrderDetailsDto extends OrderDto {
  @ApiProperty({ required: false })
  tracking_info?: {
    location: string;
    estimated_delivery: Date;
    updates: { timestamp: Date; status: string; location: string }[];
  };
}

export class OrderAnalyticsDto {
  @ApiProperty()
  total_orders: number;

  @ApiProperty()
  total_revenue: number;

  @ApiProperty()
  average_order_value: number;

  @ApiProperty()
  orders_by_status: Record<string, number>;

  @ApiProperty()
  revenue_by_status: Record<string, number>;

  @ApiProperty()
  orders_trend: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;

  @ApiProperty()
  top_payment_methods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;

  @ApiProperty()
  refund_statistics: {
    total_refunds: number;
    total_refund_amount: number;
    refund_rate: number;
  };

  @ApiProperty()
  growth_metrics: {
    order_growth: number;
    revenue_growth: number;
  };
}

export class RefundResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  refund_id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  transaction_id?: string;
}
