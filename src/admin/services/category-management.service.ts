import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../products/entities/category.entity';
import { 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CategoryDto, 
  CategoriesResponseDto, 
  CategoryTreeResponseDto, 
  CategoryTreeDto,
  CategoryStatus 
} from '../dto/category-management.dto';
import { 
  Cache, 
  CacheInvalidate 
} from "../../common/cache/decorators/cache.decorator";
import { CACHE_TTL, CACHE_PATTERNS } from "../../common/cache/constants/cache.constants";

@Injectable()
export class CategoryManagementService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  @CacheInvalidate([CACHE_PATTERNS.CATEGORIES])
  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    const category = this.categoryRepository.create(createCategoryDto);
    const saved = await this.categoryRepository.save(category);
    return this.mapToCategoryDto(saved);
  }

  @Cache({ ttl: CACHE_TTL.CATEGORY_TREE })
  async findAll(include_products: boolean): Promise<CategoriesResponseDto> {
    const categories = await this.categoryRepository.find();
    return {
      categories: categories.map(category => this.mapToCategoryDto(category))
    };
  }

  @Cache({ ttl: CACHE_TTL.CATEGORY_TREE })
  async findTree(): Promise<CategoryTreeResponseDto> {
    const categories = await this.categoryRepository
      .createQueryBuilder("category")
      .loadRelationCountAndMap("category.product_count", "category.products")
      .getMany();
    return {
      categories: categories.map(category => this.mapToCategoryTreeDto(category))
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  @CacheInvalidate([CACHE_PATTERNS.CATEGORIES])
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
    const category = await this.findOne(id);
    const updated = this.categoryRepository.merge(category, updateCategoryDto);
    const saved = await this.categoryRepository.save(updated);
    return this.mapToCategoryDto(saved);
  }

  @CacheInvalidate([CACHE_PATTERNS.CATEGORIES])
  async remove(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }

  async getAnalytics(): Promise<any> {
    // Placeholder for analytics logic
    const count = await this.categoryRepository.count();
    return { total_categories: count };
  }

  private mapToCategoryDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      parent_id: category.parent_id,
      status: CategoryStatus.ACTIVE, // Default status since entity doesn't have it
      sort_order: 0, // Default sort order
      product_count: 0, // Default product count
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }

  private mapToCategoryTreeDto(category: Category): CategoryTreeDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      status: CategoryStatus.ACTIVE, // Default status since entity doesn't have it
      product_count: category.product_count,
      level: 0, // Default level
      children: [], // Would need to implement tree logic
    };
  }
}
