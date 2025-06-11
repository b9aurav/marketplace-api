import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({ example: 'order_123' })
  @IsString()
  order_id: string;

  @ApiProperty({ example: 'pm_123' })
  @IsString()
  method_id: string;
}