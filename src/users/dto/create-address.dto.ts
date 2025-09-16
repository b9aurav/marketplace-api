import { IsString, IsBoolean, IsOptional, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAddressDto {
  @ApiProperty({ example: "Home" })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: "123 Main St" })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: "New York" })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: "NY" })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: "10001" })
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean = false;
}
