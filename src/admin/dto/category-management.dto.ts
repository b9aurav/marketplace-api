import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
