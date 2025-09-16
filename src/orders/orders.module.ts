import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { CartModule } from "../cart/cart.module";
import { ProductsModule } from "../products/products.module";
import { UsersModule } from "../users/users.module";
import { Product } from "../products/entities/product.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    TypeOrmModule,
    CartModule,
    ProductsModule,
    UsersModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
