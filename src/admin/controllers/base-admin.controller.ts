import { UseGuards, UseFilters, Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminExceptionFilter } from "../filters/admin-exception.filter";

@Controller("api/admin")
@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseFilters(AdminExceptionFilter)
export abstract class BaseAdminController {
  protected getSuccessResponse<T>(data: T, message?: string) {
    return {
      status: "success",
      message: message || "Operation completed successfully",
      data,
      timestamp: new Date().toISOString(),
    };
  }

  protected getPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ) {
    return {
      status: "success",
      message: message || "Data retrieved successfully",
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  protected getNoContentResponse(message?: string) {
    return {
      status: "success",
      message: message || "Operation completed successfully",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
