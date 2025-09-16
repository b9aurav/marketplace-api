import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { AdminProductsController } from "./admin-products.controller";
import { Product } from "./entities/product.entity";
import { Category } from "./entities/category.entity";
import { Review } from "./entities/review.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Review])],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
