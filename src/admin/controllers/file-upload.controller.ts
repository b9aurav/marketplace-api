import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AdminGuard } from "../guards/admin.guard";
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";
import { AdminUser } from "../decorators/admin-user.decorator";
import { FileUploadService } from "../services/file-upload.service";
import {
  UploadImageDto,
  FileUploadResponseDto,
  GetFilesQueryDto,
  PaginatedFilesResponseDto,
} from "../dto/file-upload.dto";
import { User } from "../../users/entities/user.entity";

@ApiTags("Admin - File Upload")
@ApiBearerAuth()
@Controller("api/admin/upload")
@UseGuards(AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post("image")
  @ApiOperation({
    summary: "Upload an image file",
    description:
      "Upload and process an image file with validation and optimization",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Image file and upload metadata",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Image file to upload",
        },
        type: {
          type: "string",
          enum: ["product", "category", "general"],
          description: "Type of file upload",
          default: "general",
        },
        metadata: {
          type: "string",
          description: "Additional metadata for the file",
        },
      },
      required: ["file"],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Image uploaded successfully",
    type: FileUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid file or upload parameters",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized access",
  })
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: "File size exceeds maximum allowed size",
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadImageDto,
    @AdminUser() user: User,
  ): Promise<FileUploadResponseDto> {
    return this.fileUploadService.uploadImage(file, uploadDto, user.id);
  }

  @Delete("image/:id")
  @ApiOperation({
    summary: "Delete an uploaded image",
    description: "Delete an image file and its metadata from the system",
  })
  @ApiParam({
    name: "id",
    description: "ID of the file to delete",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Image deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "File not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized access",
  })
  async deleteImage(
    @Param("id", ParseUUIDPipe) id: string,
    @AdminUser() user: User,
  ): Promise<void> {
    return this.fileUploadService.deleteImage(id, user.id);
  }

  @Get("files")
  @ApiOperation({
    summary: "Get uploaded files list",
    description:
      "Retrieve a paginated list of uploaded files with filtering options",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number for pagination",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of items per page",
    example: 10,
  })
  @ApiQuery({
    name: "type",
    required: false,
    description: "Filter by file type",
    enum: ["product", "category", "general"],
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by filename or original name",
  })
  @ApiQuery({
    name: "uploaded_by",
    required: false,
    description: "Filter by uploader ID (UUID format)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Files retrieved successfully",
    type: PaginatedFilesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized access",
  })
  async getFiles(
    @Query() query: GetFilesQueryDto,
  ): Promise<PaginatedFilesResponseDto> {
    return this.fileUploadService.getFiles(query);
  }

  @Get("files/:id")
  @ApiOperation({
    summary: "Get file details",
    description: "Retrieve detailed information about a specific uploaded file",
  })
  @ApiParam({
    name: "id",
    description: "ID of the file",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "File details retrieved successfully",
    type: FileUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "File not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized access",
  })
  async getFileById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<FileUploadResponseDto> {
    return this.fileUploadService.getFileById(id);
  }
}
