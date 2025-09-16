import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileUploadType } from '../../common/entities/file-upload.entity';

export class UploadImageDto {
  @ApiProperty({
    description: 'Type of file upload',
    enum: FileUploadType,
    default: FileUploadType.GENERAL,
  })
  @IsOptional()
  @IsEnum(FileUploadType)
  type?: FileUploadType = FileUploadType.GENERAL;

  @ApiPropertyOptional({
    description: 'Additional metadata for the file',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class DeleteImageDto {
  @ApiProperty({
    description: 'ID of the file to delete',
    format: 'uuid',
  })
  @IsUUID()
  id: string;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the uploaded file',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Generated filename',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename',
  })
  original_name: string;

  @ApiProperty({
    description: 'Public URL of the uploaded file',
  })
  url: string;

  @ApiProperty({
    description: 'MIME type of the file',
  })
  mime_type: string;

  @ApiProperty({
    description: 'File size in bytes',
  })
  size: number;

  @ApiProperty({
    description: 'Type of file upload',
    enum: FileUploadType,
  })
  type: FileUploadType;

  @ApiProperty({
    description: 'Upload timestamp',
  })
  created_at: Date;
}

export class GetFilesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by file type',
    enum: FileUploadType,
  })
  @IsOptional()
  @IsEnum(FileUploadType)
  type?: FileUploadType;

  @ApiPropertyOptional({
    description: 'Search by filename or original name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploader ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  uploaded_by?: string;
}

export class PaginatedFilesResponseDto {
  @ApiProperty({
    description: 'Array of file upload records',
    type: [FileUploadResponseDto],
  })
  data: FileUploadResponseDto[];

  @ApiProperty({
    description: 'Total number of files',
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
  })
  total_pages: number;
}