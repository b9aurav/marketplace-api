import { IsEmail, IsString, IsOptional } from "class-validator";

export class CreateUserDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
