import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../products/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category-management.dto';
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
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  @Cache({ ttl: CACHE_TTL.CATEGORY_TREE })
  async findAll(include_products: boolean): Promise<any[]> {
    // Basic implementation, can be expanded based on include_products
    return this.categoryRepository.find();
  }

  @Cache({ ttl: CACHE_TTL.CATEGORY_TREE })
  async findTree(): Promise<any[]> {
    // This would require a more complex implementation to build a tree structure
    return this.categoryRepository.find(); // Placeholder
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  @CacheInvalidate([CACHE_PATTERNS.CATEGORIES])
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    const updated = this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(updated);
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
}
