import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../common/decorators/roles.decorator";

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
}

export class GetUsersQueryDto {
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

  @ApiPropertyOptional({ description: "Search by name or email" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role, description: "Filter by user role" })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: "Filter by user status",
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: "Filter from date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: "Filter to date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    enum: ["name", "email", "created_at"],
    description: "Sort field",
    default: "created_at",
  })
  @IsOptional()
  @IsEnum(["name", "email", "created_at"])
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

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, description: "New user status" })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional({ description: "Reason for status change" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UserListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty({ required: false })
  last_login_at?: Date;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ description: "Total number of orders" })
  order_count: number;

  @ApiProperty({ description: "Total amount spent" })
  total_spent: number;
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserListItemDto] })
  users: UserListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;
}

export class UserDetailsDto extends UserListItemDto {
  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ type: "array", items: { type: "object" } })
  addresses: any[];

  @ApiProperty({ type: "array", items: { type: "object" } })
  recent_orders: any[];

  @ApiProperty()
  total_orders: number;

  @ApiProperty()
  average_order_value: number;

  @ApiProperty({ required: false })
  first_order_date?: Date;

  @ApiProperty({ required: false })
  last_order_date?: Date;
}

export class UserAnalyticsDto {
  @ApiProperty()
  total_users: number;

  @ApiProperty()
  active_users: number;

  @ApiProperty()
  inactive_users: number;

  @ApiProperty()
  blocked_users: number;

  @ApiProperty()
  new_users_today: number;

  @ApiProperty()
  new_users_this_week: number;

  @ApiProperty()
  new_users_this_month: number;

  @ApiProperty({ type: "array", items: { type: "object" } })
  registration_trend: Array<{
    date: string;
    count: number;
  }>;

  @ApiProperty({ type: "array", items: { type: "object" } })
  role_distribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ type: "array", items: { type: "object" } })
  activity_metrics: Array<{
    period: string;
    active_users: number;
    login_count: number;
  }>;
}

export class GetUserAnalyticsQueryDto {
  @ApiPropertyOptional({ description: "Start date for analytics (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: "End date for analytics (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    enum: ["day", "week", "month"],
    description: "Grouping interval",
    default: "day",
  })
  @IsOptional()
  @IsEnum(["day", "week", "month"])
  interval?: string = "day";
}
