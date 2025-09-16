import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsPositive,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProductDto {
  @ApiProperty({ example: "Updated Smartphone X", required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiProperty({ example: "Updated description.", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 899.99, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: ["new-image1.jpg"], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
