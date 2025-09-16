import { IsOptional, IsDateString, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GetDashboardMetricsQueryDto {
  @ApiPropertyOptional({
    description: "Start date for metrics calculation",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({
    description: "End date for metrics calculation",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}

export class GetSalesAnalyticsQueryDto {
  @ApiProperty({
    description: "Start date for analytics",
    example: "2024-01-01",
  })
  @IsDateString()
  date_from: string;

  @ApiProperty({
    description: "End date for analytics",
    example: "2024-12-31",
  })
  @IsDateString()
  date_to: string;

  @ApiPropertyOptional({
    description: "Interval for grouping data",
    enum: ["day", "week", "month"],
    default: "day",
  })
  @IsOptional()
  @IsEnum(["day", "week", "month"])
  interval?: string = "day";
}

export class DashboardMetricsDto {
  @ApiProperty({ description: "Total number of users" })
  total_users: number;

  @ApiProperty({ description: "Total number of products" })
  total_products: number;

  @ApiProperty({ description: "Total number of orders" })
  total_orders: number;

  @ApiProperty({ description: "Total revenue amount" })
  total_revenue: number;

  @ApiProperty({ description: "User growth percentage" })
  user_growth: number;

  @ApiProperty({ description: "Order growth percentage" })
  order_growth: number;

  @ApiProperty({ description: "Revenue growth percentage" })
  revenue_growth: number;

  @ApiProperty({ description: "Number of active users" })
  active_users: number;

  @ApiProperty({ description: "Number of pending orders" })
  pending_orders: number;

  @ApiProperty({ description: "Number of low stock products" })
  low_stock_products: number;
}

export class SalesTrendItem {
  @ApiProperty({ description: "Date for the trend data point" })
  date: string;

  @ApiProperty({ description: "Revenue for this period" })
  revenue: number;

  @ApiProperty({ description: "Number of orders for this period" })
  orders: number;

  @ApiProperty({ description: "Average order value for this period" })
  average_order_value: number;
}

export class SalesAnalyticsDto {
  @ApiProperty({
    description: "Sales trend data points",
    type: [SalesTrendItem],
  })
  sales_trend: SalesTrendItem[];

  @ApiProperty({ description: "Total revenue for the period" })
  total_revenue: number;

  @ApiProperty({ description: "Total number of orders for the period" })
  total_orders: number;

  @ApiProperty({ description: "Growth rate compared to previous period" })
  growth_rate: number;

  @ApiProperty({ description: "Average order value for the period" })
  average_order_value: number;

  @ApiProperty({ description: "Peak sales day" })
  peak_sales_day: string;

  @ApiProperty({ description: "Peak sales amount" })
  peak_sales_amount: number;
}
