import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { FindProductsDto } from "./dto/find-products.dto";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "Get all products with optional filtering" })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "min_price", required: false })
  @ApiQuery({ name: "max_price", required: false })
  @ApiQuery({ name: "sort", required: false })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page",
  })
  @ApiResponse({ status: 200, description: "Returns list of products" })
  async findAll(@Query() findProductsDto: FindProductsDto) {
    return this.productsService.findAll(findProductsDto);
  }

  @Get("trending")
  @ApiOperation({ summary: "Get trending products" })
  @ApiResponse({
    status: 200,
    description: "Returns list of trending products",
  })
  async getTrending() {
    return this.productsService.getTrending();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product details by ID" })
  @ApiResponse({ status: 200, description: "Returns product details" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async findOne(@Param("id") id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }
}
