import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BaseAdminController } from "./base-admin.controller";
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";
import { AdminAudit } from "../decorators/admin-audit.decorator";
import { AdminUser } from "../decorators/admin-user.decorator";
import { AdminSuccessResponseDto } from "../dto/admin-response.dto";

@Controller("test")
@UseInterceptors(AdminAuditInterceptor)
export class AdminTestController extends BaseAdminController {
  @Get("health")
  @ApiOperation({ summary: "Test admin endpoint health" })
  @ApiResponse({
    status: 200,
    description: "Health check successful",
    type: AdminSuccessResponseDto,
  })
  @AdminAudit({
    action: "health_check",
    resource: "system",
    description: "Admin health check endpoint accessed",
  })
  async healthCheck(@AdminUser() user: any) {
    return this.getSuccessResponse(
      {
        status: "healthy",
        admin: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        timestamp: new Date().toISOString(),
      },
      "Admin API is healthy",
    );
  }
}
