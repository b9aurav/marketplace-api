import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "../entities/order.entity";

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
