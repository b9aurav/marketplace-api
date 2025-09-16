import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsDateString,
  IsEnum,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class AdminQueryDto {
  @ApiPropertyOptional({ description: "Page number", minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: "Search term" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ description: "Date from (ISO string)" })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: "Date to (ISO string)" })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    default: "desc",
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sort_order?: "asc" | "desc" = "desc";
}
