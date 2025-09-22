import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ enum: CategoryStatus, description: 'Category status' })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsString()
  @IsOptional()
  slug?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  parent_id?: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  sort_order: number;

  @ApiProperty({ enum: CategoryStatus })
  status: CategoryStatus;

  @ApiProperty()
  product_count: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CategoryTreeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  product_count: number;

  @ApiProperty({ enum: CategoryStatus })
  status: CategoryStatus;

  @ApiProperty()
  level: number;

  @ApiProperty({ type: [CategoryTreeDto] })
  children: CategoryTreeDto[];
}

export class CategoriesResponseDto {
  @ApiProperty({ type: [CategoryDto] })
  categories: CategoryDto[];
}

export class CategoryTreeResponseDto {
  @ApiProperty({ type: [CategoryTreeDto] })
  categories: CategoryTreeDto[];
}
