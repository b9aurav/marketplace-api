import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseUUIDPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminAuditInterceptor } from '../interceptors/admin-audit.interceptor';
import { CategoryManagementService } from '../services/category-management.service';
import { 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CategoriesResponseDto,
  CategoryTreeResponseDto,
  CategoryDto 
} from '../dto/category-management.dto';

@ApiTags('Admin - Category Management')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
export class CategoryManagementController {
  constructor(private readonly categoryService: CategoryManagementService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Create a new category with hierarchical support'
  })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get list of categories',
    description: 'Retrieve all categories with optional product count'
  })
  @ApiQuery({ name: 'include_products', required: false, description: 'Include product count' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: CategoriesResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAll(@Query('include_products') includeProducts: string): Promise<CategoriesResponseDto> {
    const include = includeProducts === 'true';
    return this.categoryService.findAll(include);
  }

  @Get('tree')
  @ApiOperation({
    summary: 'Get hierarchical category tree',
    description: 'Retrieve categories in hierarchical tree structure'
  })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully', type: CategoryTreeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findTree(): Promise<CategoryTreeResponseDto> {
    return this.categoryService.findTree();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get category performance analytics',
    description: 'Retrieve category analytics and performance metrics'
  })
  @ApiResponse({ status: 200, description: 'Category analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getAnalytics() {
    return this.categoryService.getAnalytics();
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update existing category',
    description: 'Update category information and hierarchy'
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Delete a category (soft delete)'
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
