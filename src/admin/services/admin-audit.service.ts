import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminAuditLog } from "../entities/admin-audit-log.entity";

export interface AuditLogData {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  status?: "success" | "failure";
  errorMessage?: string;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditLogRepository: Repository<AdminAuditLog>,
  ) {}

  async logAction(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        admin_id: data.adminId,
        action: data.action,
        resource: data.resource,
        resource_id: data.resourceId,
        description: data.description,
        metadata: data.metadata,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        status: data.status || "success",
        error_message: data.errorMessage,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Admin action logged: ${data.action} on ${data.resource} by admin ${data.adminId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log admin action: ${error.message}`,
        error.stack,
      );
    }
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    adminId?: string,
    action?: string,
    resource?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ logs: AdminAuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.admin", "admin")
      .orderBy("audit.created_at", "DESC");

    if (adminId) {
      queryBuilder.andWhere("audit.admin_id = :adminId", { adminId });
    }

    if (action) {
      queryBuilder.andWhere("audit.action = :action", { action });
    }

    if (resource) {
      queryBuilder.andWhere("audit.resource = :resource", { resource });
    }

    if (dateFrom) {
      queryBuilder.andWhere("audit.created_at >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("audit.created_at <= :dateTo", { dateTo });
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }
}
