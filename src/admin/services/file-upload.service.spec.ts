import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FileUploadService } from "./file-upload.service";
import {
  FileUpload,
  FileUploadType,
} from "../../common/entities/file-upload.entity";
import { CacheService } from "../../common/cache/cache.service";
import { AdminAuditService } from "./admin-audit.service";
import { UploadImageDto } from "../dto/file-upload.dto";
import * as fs from "fs/promises";
import * as sharp from "sharp";

// Mock external dependencies
jest.mock("fs/promises");
jest.mock("sharp");

describe("FileUploadService", () => {
  let service: FileUploadService;
  let fileUploadRepository: jest.Mocked<Repository<FileUpload>>;
  let cacheService: jest.Mocked<CacheService>;
  let auditService: jest.Mocked<AdminAuditService>;

  const mockFile: Express.Multer.File = {
    fieldname: "file",
    originalname: "test-image.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from("fake-image-data"),
    destination: "",
    filename: "",
    path: "",
    stream: null,
  };

  const mockFileUpload: FileUpload = {
    id: "test-file-id",
    filename: "test-filename.jpg",
    original_name: "test-image.jpg",
    url: "http://localhost:3000/uploads/test-filename.jpg",
    mime_type: "image/jpeg",
    size: 1024 * 1024,
    type: FileUploadType.GENERAL,
    uploaded_by: "user-id",
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: getRepositoryToken(FileUpload),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
          },
        },
        {
          provide: AdminAuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    fileUploadRepository = module.get(getRepositoryToken(FileUpload));
    cacheService = module.get(CacheService);
    auditService = module.get(AdminAuditService);

    // Mock fs operations
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    // Mock sharp operations
    const mockSharp = {
      metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest
        .fn()
        .mockResolvedValue(Buffer.from("processed-image-data")),
    };
    (sharp as any).mockReturnValue(mockSharp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadImage", () => {
    const uploadDto: UploadImageDto = {
      type: FileUploadType.PRODUCT,
    };

    it("should upload image successfully", async () => {
      fileUploadRepository.create.mockReturnValue(mockFileUpload);
      fileUploadRepository.save.mockResolvedValue(mockFileUpload);
      cacheService.delPattern.mockResolvedValue();
      auditService.logAction.mockResolvedValue();

      const result = await service.uploadImage(mockFile, uploadDto, "user-id");

      expect(result).toEqual({
        id: mockFileUpload.id,
        filename: mockFileUpload.filename,
        original_name: mockFileUpload.original_name,
        url: mockFileUpload.url,
        mime_type: mockFileUpload.mime_type,
        size: mockFileUpload.size,
        type: mockFileUpload.type,
        created_at: mockFileUpload.created_at,
      });

      expect(fileUploadRepository.create).toHaveBeenCalled();
      expect(fileUploadRepository.save).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: "user-id",
          action: "FILE_UPLOAD",
          resource: "FileUpload",
          resourceId: mockFileUpload.id,
          metadata: expect.any(Object),
        }),
      );
      expect(cacheService.delPattern).toHaveBeenCalledWith("admin:files:*");
    });

    it("should throw BadRequestException for oversized file", async () => {
      const oversizedFile = {
        ...mockFile,
        size: 15 * 1024 * 1024, // 15MB
      };

      await expect(
        service.uploadImage(oversizedFile, uploadDto, "user-id"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid MIME type", async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: "application/pdf",
      };

      await expect(
        service.uploadImage(invalidFile, uploadDto, "user-id"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for empty file", async () => {
      const emptyFile = {
        ...mockFile,
        buffer: Buffer.alloc(0),
      };

      await expect(
        service.uploadImage(emptyFile, uploadDto, "user-id"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should handle file processing errors gracefully", async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error("Disk full"));

      await expect(
        service.uploadImage(mockFile, uploadDto, "user-id"),
      ).rejects.toThrow(BadRequestException);

      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe("deleteImage", () => {
    it("should delete image successfully", async () => {
      fileUploadRepository.findOne.mockResolvedValue(mockFileUpload);
      fileUploadRepository.remove.mockResolvedValue(mockFileUpload);
      auditService.logAction.mockResolvedValue();
      cacheService.delPattern.mockResolvedValue();

      await service.deleteImage("test-file-id", "user-id");

      expect(fileUploadRepository.findOne).toHaveBeenCalledWith({
        where: { id: "test-file-id" },
      });
      expect(fs.unlink).toHaveBeenCalled();
      expect(fileUploadRepository.remove).toHaveBeenCalledWith(mockFileUpload);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: "user-id",
          action: "FILE_DELETE",
          resource: "FileUpload",
          resourceId: "test-file-id",
          metadata: expect.any(Object),
        }),
      );
      expect(cacheService.delPattern).toHaveBeenCalledWith("admin:files:*");
    });

    it("should throw NotFoundException for non-existent file", async () => {
      fileUploadRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteImage("non-existent-id", "user-id"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle file system errors gracefully", async () => {
      fileUploadRepository.findOne.mockResolvedValue(mockFileUpload);
      (fs.unlink as jest.Mock).mockRejectedValue(new Error("File not found"));
      fileUploadRepository.remove.mockResolvedValue(mockFileUpload);

      await expect(
        service.deleteImage("test-file-id", "user-id"),
      ).resolves.not.toThrow();

      expect(fileUploadRepository.remove).toHaveBeenCalled();
    });
  });

  describe("getFiles", () => {
    const mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    beforeEach(() => {
      fileUploadRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it("should return paginated files from cache", async () => {
      const cachedResult = {
        data: [mockFileUpload],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getFiles({ page: 1, limit: 10 });

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalled();
      expect(fileUploadRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should return paginated files from database when not cached", async () => {
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockFileUpload], 1]);
      cacheService.set.mockResolvedValue();

      const result = await service.getFiles({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [
          expect.objectContaining({
            id: mockFileUpload.id,
            filename: mockFileUpload.filename,
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      });

      expect(fileUploadRepository.createQueryBuilder).toHaveBeenCalledWith(
        "file",
      );
      expect(cacheService.set).toHaveBeenCalled();
    });

    it("should apply filters correctly", async () => {
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getFiles({
        page: 1,
        limit: 10,
        type: FileUploadType.PRODUCT,
        search: "test",
        uploaded_by: "user-id",
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "file.type = :type",
        {
          type: FileUploadType.PRODUCT,
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(file.filename ILIKE :search OR file.original_name ILIKE :search)",
        { search: "%test%" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "file.uploaded_by = :uploaded_by",
        { uploaded_by: "user-id" },
      );
    });
  });

  describe("getFileById", () => {
    it("should return file from cache", async () => {
      const cachedFile = {
        id: mockFileUpload.id,
        filename: mockFileUpload.filename,
        original_name: mockFileUpload.original_name,
        url: mockFileUpload.url,
        mime_type: mockFileUpload.mime_type,
        size: mockFileUpload.size,
        type: mockFileUpload.type,
        created_at: mockFileUpload.created_at,
      };
      cacheService.get.mockResolvedValue(cachedFile);

      const result = await service.getFileById("test-file-id");

      expect(result).toEqual(cachedFile);
      expect(cacheService.get).toHaveBeenCalledWith(
        "admin:files:details:test-file-id",
      );
      expect(fileUploadRepository.findOne).not.toHaveBeenCalled();
    });

    it("should return file from database when not cached", async () => {
      cacheService.get.mockResolvedValue(null);
      fileUploadRepository.findOne.mockResolvedValue(mockFileUpload);
      cacheService.set.mockResolvedValue();

      const result = await service.getFileById("test-file-id");

      expect(result).toEqual({
        id: mockFileUpload.id,
        filename: mockFileUpload.filename,
        original_name: mockFileUpload.original_name,
        url: mockFileUpload.url,
        mime_type: mockFileUpload.mime_type,
        size: mockFileUpload.size,
        type: mockFileUpload.type,
        created_at: mockFileUpload.created_at,
      });

      expect(fileUploadRepository.findOne).toHaveBeenCalledWith({
        where: { id: "test-file-id" },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        "admin:files:details:test-file-id",
        expect.any(Object),
        30 * 60,
      );
    });

    it("should throw NotFoundException for non-existent file", async () => {
      cacheService.get.mockResolvedValue(null);
      fileUploadRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileById("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
