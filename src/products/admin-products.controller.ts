import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles, Role } from "../common/decorators/roles.decorator";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@ApiTags("Admin Products Legacy")
@Controller("admin/products-legacy")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new product" })
  @ApiResponse({ status: 201, description: "Product created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a product" })
  @ApiResponse({ status: 200, description: "Product updated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async update(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Post("bulk-upload")
  @ApiOperation({ summary: "Bulk upload products via CSV" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 202, description: "Processing started" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @UseInterceptors(FileInterceptor("file"))
  async bulkUpload(@UploadedFile() file: Express.Multer.File) {
    // In a real implementation, this would process the CSV file
    return {
      message: "Bulk upload processing started",
      fileName: file.originalname,
      size: file.size,
    };
  }

  @Post("categories")
  @ApiOperation({ summary: "Create a new category" })
  @ApiResponse({ status: 201, description: "Category created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async createCategory(
    @Body()
    createCategoryDto: {
      name: string;
      description?: string;
      image?: string;
    },
  ) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all product categories" })
  @ApiResponse({ status: 200, description: "Returns list of categories" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getCategories() {
    return this.productsService.getCategories();
  }
}
