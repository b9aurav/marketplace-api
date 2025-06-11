import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiResponse({ status: 200, description: 'Returns dashboard summary' })
  async getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('dashboard/sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiQuery({ name: 'range', required: false, example: 'last_30_days' })
  @ApiResponse({ status: 200, description: 'Returns sales analytics' })
  async getSalesAnalytics(@Query('range') range?: string) {
    return this.adminService.getSalesAnalytics(range);
  }

  @Get('users')
  @ApiOperation({ summary: 'List/search users' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Returns users list' })
  async getUsers(@Query('search') search?: string) {
    return this.adminService.getUsers(search);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  async blockUser(@Param('id') userId: string) {
    return this.adminService.blockUser(userId);
  }
}