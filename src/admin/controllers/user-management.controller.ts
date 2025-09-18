import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";
import { UserManagementService } from "../services/user-management.service";
import { GetUser } from "../../common/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import {
  GetUsersQueryDto,
  UpdateUserStatusDto,
  PaginatedUsersDto,
  UserDetailsDto,
  UserAnalyticsDto,
  GetUserAnalyticsQueryDto,
} from "../dto/user-management.dto";

@ApiTags("Admin - User Management")
@ApiBearerAuth()
@Controller("admin/users")
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
export class UserManagementController {
  private readonly logger = new Logger(UserManagementController.name);

  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({
    summary: "Get paginated list of users",
    description:
      "Retrieve a paginated list of users with filtering and sorting options. Results are cached for improved performance.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Users retrieved successfully",
    type: PaginatedUsersDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - Admin access required",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Forbidden - Insufficient permissions",
  })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersDto> {
    return this.userManagementService.getUsers(query);
  }

  @Get("analytics")
  @ApiOperation({
    summary: "Get user analytics",
    description:
      "Retrieve comprehensive user analytics including registration trends, role distribution, and activity metrics.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User analytics retrieved successfully",
    type: UserAnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - Admin access required",
  })
  async getUserAnalytics(
    @Query() query: GetUserAnalyticsQueryDto,
  ): Promise<UserAnalyticsDto> {
    this.logger.log(
      `Getting user analytics with query: ${JSON.stringify(query)}`,
    );
    return this.userManagementService.getUserAnalytics(query);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get user details",
    description:
      "Retrieve detailed information about a specific user including addresses, order history, and statistics.",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    type: "string",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User details retrieved successfully",
    type: UserDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - Admin access required",
  })
  async getUserDetails(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<UserDetailsDto> {
    this.logger.log(`Getting user details for ID: ${id}`);
    return this.userManagementService.getUserDetails(id);
  }

  @Patch(":id/status")
  @ApiOperation({
    summary: "Update user status",
    description:
      "Update the status of a user (active/inactive/blocked). This action is logged for audit purposes.",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    type: "string",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User status updated successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid status value",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - Admin access required",
  })
  async updateUserStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserStatusDto,
    @GetUser() admin: User,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Updating user ${id} status to ${updateDto.status} by admin ${admin.id}`,
    );

    await this.userManagementService.updateUserStatus(id, updateDto, admin.id);

    return {
      message: `User status updated to ${updateDto.status} successfully`,
    };
  }
}
