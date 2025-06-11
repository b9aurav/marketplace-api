import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopUpWalletDto {
  @ApiProperty({ example: 50.00 })
  @IsNumber()
  @IsPositive()
  amount: number;
}