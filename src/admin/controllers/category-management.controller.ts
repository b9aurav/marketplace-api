import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { CategoryManagementService } from '../services/category-management.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category-management.dto';

@Controller('admin/categories')
export class CategoryManagementController {
  constructor(private readonly categoryService: CategoryManagementService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query('include_products') includeProducts: string) {
    const include = includeProducts === 'true';
    return this.categoryService.findAll(include);
  }

  @Get('tree')
  findTree() {
    return this.categoryService.findTree();
  }

  @Get('analytics')
  getAnalytics() {
    return this.categoryService.getAnalytics();
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
