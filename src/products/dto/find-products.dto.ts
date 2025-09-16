import { IsString, IsOptional, IsNumber, IsEnum, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto } from "../../common/dto/pagination.dto";

export enum SortOption {
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  NEWEST = "newest",
  RATING = "rating",
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
}

export class FindProductsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string; // Add this if you want search functionality

  @ApiProperty({
    enum: SortOption,
    required: false,
    description:
      "Sort products by: price_asc, price_desc, newest, rating, name_asc, name_desc",
  })
  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;
}
