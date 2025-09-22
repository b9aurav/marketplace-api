import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  FileUpload,
  FileUploadType,
} from "../../common/entities/file-upload.entity";
import { CacheService } from "../../common/cache/cache.service";
import { AdminAuditService } from "./admin-audit.service";
import {
  UploadImageDto,
  FileUploadResponseDto,
  FileUploadDetailedResponseDto,
  GetFilesQueryDto,
  PaginatedFilesResponseDto,
} from "../dto/file-upload.dto";
import * as path from "path";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import * as sharp from "sharp";

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadPath = process.env.UPLOAD_PATH || "./uploads";
  private readonly baseUrl = process.env.BASE_URL || "http://localhost:3000";
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  constructor(
    @InjectRepository(FileUpload)
    private fileUploadRepository: Repository<FileUpload>,
    private cacheService: CacheService,
    private auditService: AdminAuditService,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    uploadDto: UploadImageDto,
    uploadedBy: string,
  ): Promise<FileUploadResponseDto> {
    this.logger.log(`Uploading image: ${file.originalname}`);

    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = this.generateUniqueFilename(fileExtension);
    const filePath = path.join(this.uploadPath, uniqueFilename);

    try {
      // Process and optimize image
      const processedBuffer = await this.processImage(
        file.buffer,
        file.mimetype,
      );

      // Save file to disk
      await fs.writeFile(filePath, processedBuffer);

      // Generate public URL
      const publicUrl = `${this.baseUrl}/uploads/${uniqueFilename}`;

      // Save file metadata to database
      const fileUpload = this.fileUploadRepository.create({
        filename: uniqueFilename,
        original_name: file.originalname,
        url: publicUrl,
        mime_type: file.mimetype,
        size: processedBuffer.length,
        type: uploadDto.type || FileUploadType.GENERAL,
        uploaded_by: uploadedBy,
      });

      const savedFile = await this.fileUploadRepository.save(fileUpload);

      // Log audit trail
      await this.auditService.logAction({
        adminId: uploadedBy,
        action: "FILE_UPLOAD",
        resource: "FileUpload",
        resourceId: savedFile.id,
        description: `Uploaded file: ${file.originalname}`,
        metadata: {
          filename: uniqueFilename,
          original_name: file.originalname,
          size: processedBuffer.length,
          type: uploadDto.type,
        },
        ipAddress: "127.0.0.1", // This should be passed from the request
        status: "success",
      });

      // Invalidate related cache
      await this.invalidateFileCache();

      this.logger.log(`Image uploaded successfully: ${uniqueFilename}`);

      return this.mapToResponseDto(savedFile);
    } catch (error) {
      this.logger.error(
        `Failed to upload image: ${error.message}`,
        error.stack,
      );

      // Clean up file if it was created
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to cleanup file after error: ${cleanupError.message}`,
        );
      }

      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`Deleting image with ID: ${id}`);

    const fileUpload = await this.fileUploadRepository.findOne({
      where: { id },
    });

    if (!fileUpload) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    try {
      // Delete file from disk
      const filePath = path.join(this.uploadPath, fileUpload.filename);
      try {
        await fs.unlink(filePath);
        this.logger.log(`Deleted file from disk: ${fileUpload.filename}`);
      } catch (error) {
        this.logger.warn(`Failed to delete file from disk: ${error.message}`);
      }

      // Remove from database
      await this.fileUploadRepository.remove(fileUpload);

      // Log audit trail
      await this.auditService.logAction({
        adminId: deletedBy,
        action: "FILE_DELETE",
        resource: "FileUpload",
        resourceId: id,
        description: `Deleted file: ${fileUpload.original_name}`,
        metadata: {
          filename: fileUpload.filename,
          original_name: fileUpload.original_name,
        },
        ipAddress: "127.0.0.1", // This should be passed from the request
        status: "success",
      });

      // Invalidate related cache
      await this.invalidateFileCache();

      this.logger.log(`Image deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete image: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }

  async getFiles(query: GetFilesQueryDto): Promise<PaginatedFilesResponseDto> {
    const cacheKey = `admin:files:list:${JSON.stringify(query)}`;

    // Try to get from cache first
    const cached =
      await this.cacheService.get<PaginatedFilesResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page = 1, limit = 10, type, search, uploaded_by } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.fileUploadRepository.createQueryBuilder("file");

    // Apply filters
    if (type) {
      queryBuilder.andWhere("file.type = :type", { type });
    }

    if (search) {
      queryBuilder.andWhere(
        "(file.filename ILIKE :search OR file.original_name ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (uploaded_by) {
      queryBuilder.andWhere("file.uploaded_by = :uploaded_by", { uploaded_by });
    }

    // Apply pagination and ordering
    queryBuilder.orderBy("file.created_at", "DESC").skip(skip).take(limit);

    const [files, total] = await queryBuilder.getManyAndCount();

    const result: PaginatedFilesResponseDto = {
      data: files.map((file) => this.mapToDetailedResponseDto(file)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };

    // Cache the result for 10 minutes
    await this.cacheService.set(cacheKey, result, 10 * 60);

    return result;
  }

  async getFileById(id: string): Promise<FileUploadDetailedResponseDto> {
    const cacheKey = `admin:files:details:${id}`;

    // Try to get from cache first
    const cached = await this.cacheService.get<FileUploadDetailedResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const file = await this.fileUploadRepository.findOne({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    const result = this.mapToDetailedResponseDto(file);

    // Cache the result for 30 minutes
    await this.cacheService.set(cacheKey, result, 30 * 60);

    return result;
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(", ")}`,
      );
    }

    // Check if file has content
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException("File is empty");
    }
  }

  private generateUniqueFilename(extension: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString("hex");
    return `${timestamp}-${randomBytes}${extension}`;
  }

  private async processImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<Buffer> {
    // Skip processing for SVG files
    if (mimeType === "image/svg+xml") {
      return buffer;
    }

    try {
      // Use Sharp to optimize images
      let sharpInstance = sharp(buffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();

      // Resize if image is too large (max 2048px on longest side)
      if (metadata.width && metadata.height) {
        const maxDimension = Math.max(metadata.width, metadata.height);
        if (maxDimension > 2048) {
          const ratio = 2048 / maxDimension;
          const newWidth = Math.round(metadata.width * ratio);
          const newHeight = Math.round(metadata.height * ratio);

          sharpInstance = sharpInstance.resize(newWidth, newHeight, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }
      }

      // Optimize based on format
      if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
        sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
      } else if (mimeType === "image/png") {
        sharpInstance = sharpInstance.png({ compressionLevel: 8 });
      } else if (mimeType === "image/webp") {
        sharpInstance = sharpInstance.webp({ quality: 85 });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      this.logger.warn(
        `Failed to process image, using original: ${error.message}`,
      );
      return buffer;
    }
  }

  private mapToResponseDto(file: FileUpload): FileUploadResponseDto {
    return {
      url: file.url,
      filename: file.filename,
      size: file.size,
      mime_type: file.mime_type,
    };
  }

  private mapToDetailedResponseDto(file: FileUpload): FileUploadDetailedResponseDto {
    return {
      id: file.id,
      filename: file.filename,
      original_name: file.original_name,
      url: file.url,
      mime_type: file.mime_type,
      size: file.size,
      type: file.type,
      created_at: file.created_at,
    };
  }

  private async invalidateFileCache(): Promise<void> {
    try {
      await this.cacheService.delPattern("admin:files:*");
      this.logger.debug("Invalidated file cache");
    } catch (error) {
      this.logger.warn(`Failed to invalidate file cache: ${error.message}`);
    }
  }
}
