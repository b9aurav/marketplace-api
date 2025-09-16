import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminAuditService, AuditLogData } from "./admin-audit.service";
import { AdminAuditLog } from "../entities/admin-audit-log.entity";

describe("AdminAuditService", () => {
  let service: AdminAuditService;
  let repository: jest.Mocked<Repository<AdminAuditLog>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuditService,
        {
          provide: getRepositoryToken(AdminAuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminAuditService>(AdminAuditService);
    repository = module.get(getRepositoryToken(AdminAuditLog));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should log admin action successfully", async () => {
    const auditData: AuditLogData = {
      adminId: "admin-123",
      action: "CREATE",
      resource: "user",
      resourceId: "user-456",
      description: "Created new user",
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
    };

    const mockAuditLog = { id: "audit-123", ...auditData };
    repository.create.mockReturnValue(mockAuditLog as any);
    repository.save.mockResolvedValue(mockAuditLog as any);

    await service.logAction(auditData);

    expect(repository.create).toHaveBeenCalledWith({
      admin_id: auditData.adminId,
      action: auditData.action,
      resource: auditData.resource,
      resource_id: auditData.resourceId,
      description: auditData.description,
      metadata: auditData.metadata,
      ip_address: auditData.ipAddress,
      user_agent: auditData.userAgent,
      status: "success",
      error_message: auditData.errorMessage,
    });
    expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
  });

  it("should handle logging errors gracefully", async () => {
    const auditData: AuditLogData = {
      adminId: "admin-123",
      action: "CREATE",
      resource: "user",
      ipAddress: "127.0.0.1",
    };

    repository.create.mockImplementation(() => {
      throw new Error("Database error");
    });

    // Should not throw error
    await expect(service.logAction(auditData)).resolves.toBeUndefined();
  });
});
