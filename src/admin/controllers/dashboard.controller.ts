import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { AdminGuard } from '../guards/admin.guard';
import { AdminAuditInterceptor } from '../interceptors/admin-audit.interceptor';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard'; // Import SupabaseAuthGuard
import { 
  DashboardMetricsDto, 
  SalesAnalyticsDto,
  GetDashboardMetricsQueryDto,
  GetSalesAnalyticsQueryDto
} from '../dto/dashboard.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(SupabaseAuthGuard, AdminGuard) // Use SupabaseAuthGuard
@UseInterceptors(AdminAuditInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get dashboard metrics',
    description: 'Retrieve comprehensive dashboard metrics including user, product, order counts and growth rates. Data is cached for 5 minutes for optimal performance.'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    type: DashboardMetricsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin access required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getDashboardMetrics(
    @Query() query: GetDashboardMetricsQueryDto,
  ): Promise<DashboardMetricsDto> {
    return this.dashboardService.getDashboardMetrics(query);
  }

  @Get('sales-analytics')
  @ApiOperation({ 
    summary: 'Get sales analytics',
    description: 'Retrieve detailed sales analytics with trend data, growth rates, and performance metrics. Supports date range filtering and interval grouping (day, week, month). Data is cached for 5 minutes.'
  })
  @ApiResponse({
    status: 200,
    description: 'Sales analytics retrieved successfully',
    type: SalesAnalyticsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid date parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin access required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getSalesAnalytics(
    @Query() query: GetSalesAnalyticsQueryDto,
  ): Promise<SalesAnalyticsDto> {
    return this.dashboardService.getSalesAnalytics(query);
  }
}
