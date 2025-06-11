import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPaymentMethodDto {
  @ApiProperty({ example: 'tok_visa' })
  @IsString()
  stripe_token: string;
}