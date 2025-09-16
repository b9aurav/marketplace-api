import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";
import { ProductManagementService } from "../services/product-management.service";
import {
  GetProductsQueryDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
  UpdateInventoryDto,
  BulkProductActionDto,
  ExportProductsDto,
  ProductDetailsDto,
  ProductAnalyticsDto,
  ExportResultDto,
  PaginatedProductsDto,
} from "../dto/product-management.dto";

@ApiTags("Admin - Product Management")
@Controller("api/admin/products")
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@ApiBearerAuth()
export class ProductManagementController {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get products with comprehensive filtering",
    description:
      "Retrieve paginated list of products with advanced filtering and sorting options",
  })
  @ApiResponse({
    status: 200,
    description: "Products retrieved successfully",
    type: PaginatedProductsDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getProducts(
    @Query() query: GetProductsQueryDto,
  ): Promise<PaginatedProductsDto> {
    return this.productManagementService.getProducts(query);
  }

  @Get("analytics")
  @ApiOperation({
    summary: "Get product analytics",
    description: "Retrieve comprehensive product analytics and metrics",
  })
  @ApiResponse({
    status: 200,
    description: "Product analytics retrieved successfully",
    type: ProductAnalyticsDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiQuery({
    name: "date_from",
    required: false,
    type: String,
    description: "Filter from date (ISO string)",
  })
  @ApiQuery({
    name: "date_to",
    required: false,
    type: String,
    description: "Filter to date (ISO string)",
  })
  async getProductAnalytics(
    @Query("date_from") dateFrom?: string,
    @Query("date_to") dateTo?: string,
  ): Promise<ProductAnalyticsDto> {
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    return this.productManagementService.getProductAnalytics(
      dateFromObj,
      dateToObj,
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get product details",
    description: "Retrieve detailed information about a specific product",
  })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product details retrieved successfully",
    type: ProductDetailsDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  async getProductDetails(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ProductDetailsDto> {
    return this.productManagementService.getProductDetails(id);
  }

  @Post()
  @ApiOperation({
    summary: "Create new product",
    description: "Create a new product with comprehensive details",
  })
  @ApiResponse({
    status: 201,
    description: "Product created successfully",
    type: ProductDetailsDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 409, description: "Conflict - SKU already exists" })
  async createProduct(
    @Body() data: AdminCreateProductDto,
  ): Promise<ProductDetailsDto> {
    return this.productManagementService.createProduct(data);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update product",
    description: "Update an existing product with new information",
  })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product updated successfully",
    type: ProductDetailsDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 409, description: "Conflict - SKU already exists" })
  async updateProduct(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: AdminUpdateProductDto,
  ): Promise<ProductDetailsDto> {
    return this.productManagementService.updateProduct(id, data);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete product (soft delete)",
    description: "Soft delete a product by setting its status to inactive",
  })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({ status: 204, description: "Product deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.productManagementService.deleteProduct(id);
  }

  @Patch(":id/inventory")
  @ApiOperation({
    summary: "Update product inventory",
    description:
      "Update stock quantity and minimum stock threshold for a product",
  })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({ status: 200, description: "Inventory updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request - Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  async updateInventory(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateInventoryDto,
  ): Promise<{ message: string }> {
    await this.productManagementService.updateInventory(id, data);
    return { message: "Inventory updated successfully" };
  }

  @Post("bulk-action")
  @ApiOperation({
    summary: "Perform bulk actions on products",
    description:
      "Perform bulk operations like activate, deactivate, delete, feature, or unfeature on multiple products",
  })
  @ApiResponse({
    status: 200,
    description: "Bulk action completed successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input data or some products not found",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async bulkAction(
    @Body() data: BulkProductActionDto,
  ): Promise<{ message: string }> {
    await this.productManagementService.bulkAction(data);
    return { message: "Bulk action completed successfully" };
  }

  @Post("export")
  @ApiOperation({
    summary: "Export products data",
    description:
      "Export products data in CSV or XLSX format with filtering options",
  })
  @ApiResponse({
    status: 202,
    description: "Export process started",
    type: ExportResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid export parameters",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async exportProducts(
    @Body() data: ExportProductsDto,
  ): Promise<ExportResultDto> {
    return this.productManagementService.exportProducts();
  }
}
