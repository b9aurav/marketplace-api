import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, In } from "typeorm";
import { Product, ProductStatus } from "../../products/entities/product.entity";
import { Category } from "../../products/entities/category.entity";
import { CacheService } from "../../common/cache/cache.service";
import { 
  CacheList, 
  Cache, 
  CacheAnalytics, 
  CacheInvalidate 
} from "../../common/cache/decorators/cache.decorator";
import { CACHE_PATTERNS } from "../../common/cache/constants/cache.constants";
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

// Cache configuration
const CACHE_TTL = {
  PRODUCT_LIST: 15 * 60, // 15 minutes
  PRODUCT_DETAILS: 30 * 60, // 30 minutes
  PRODUCT_ANALYTICS: 10 * 60, // 10 minutes
} as const;

const CACHE_KEYS = {
  PRODUCT_LIST: "admin:products:list",
  PRODUCT_DETAILS: "admin:products:details",
  PRODUCT_ANALYTICS: "admin:products:analytics",
} as const;

@Injectable()
export class ProductManagementService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly cacheService: CacheService,
  ) {}

  @CacheList(CACHE_TTL.PRODUCT_LIST)
  async getProducts(query: GetProductsQueryDto): Promise<PaginatedProductsDto> {
    const cacheKey = this.generateCacheKey(CACHE_KEYS.PRODUCT_LIST, query);

    // Try to get from cache first
    const cached = await this.cacheService.get<PaginatedProductsDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      page = 1,
      limit = 20,
      search,
      category_id,
      status,
      featured,
      min_price,
      max_price,
      min_stock,
      max_stock,
      date_from,
      date_to,
      sort_by = "created_at",
      sort_order = "desc",
      tags,
    } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category");

    // Apply filters
    this.applyFilters(queryBuilder, {
      search,
      category_id,
      status,
      featured,
      min_price,
      max_price,
      min_stock,
      max_stock,
      date_from,
      date_to,
      tags,
    });

    // Apply sorting
    this.applySorting(queryBuilder, sort_by, sort_order);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const products = await queryBuilder.getMany();

    // Transform to DTOs
    const productDtos = await Promise.all(
      products.map((product) => this.transformToProductDetailsDto(product)),
    );

    const result: PaginatedProductsDto = {
      products: productDtos,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.PRODUCT_LIST);

    return result;
  }

  @Cache({ ttl: CACHE_TTL.PRODUCT_DETAILS, keyGenerator: (args) => `product:${args[0]}` })
  async getProductDetails(id: string): Promise<ProductDetailsDto> {
    const cacheKey = `${CACHE_KEYS.PRODUCT_DETAILS}:${id}`;

    // Try to get from cache first
    const cached = await this.cacheService.get<ProductDetailsDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ["category", "reviews"],
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const productDto = await this.transformToProductDetailsDto(product);

    // Cache the result
    await this.cacheService.set(
      cacheKey,
      productDto,
      CACHE_TTL.PRODUCT_DETAILS,
    );

    return productDto;
  }

  @CacheInvalidate([CACHE_PATTERNS.PRODUCTS])
  async createProduct(data: AdminCreateProductDto): Promise<ProductDetailsDto> {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findOne({
      where: { sku: data.sku },
    });

    if (existingProduct) {
      throw new ConflictException("Product with this SKU already exists");
    }

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: data.category_id },
    });

    if (!category) {
      throw new BadRequestException("Category not found");
    }

    // Create product
    const product = this.productRepository.create({
      ...data,
      rating: 0,
      sales_count: 0,
    });

    const savedProduct = await this.productRepository.save(product);

    // Invalidate cache
    await this.invalidateProductCaches();

    return this.getProductDetails(savedProduct.id);
  }

  async updateProduct(
    id: string,
    data: AdminUpdateProductDto,
  ): Promise<ProductDetailsDto> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    // Check SKU uniqueness if updating SKU
    if (data.sku && data.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: data.sku },
      });

      if (existingProduct) {
        throw new ConflictException("Product with this SKU already exists");
      }
    }

    // Verify category exists if updating category
    if (data.category_id && data.category_id !== product.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: data.category_id },
      });

      if (!category) {
        throw new BadRequestException("Category not found");
      }
    }

    // Update product
    Object.assign(product, data);
    const updatedProduct = await this.productRepository.save(product);

    // Invalidate cache
    await this.invalidateProductCaches(id);

    return this.getProductDetails(updatedProduct.id);
  }

  @CacheInvalidate([CACHE_PATTERNS.PRODUCTS])
  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    // Soft delete by setting status to inactive
    product.status = ProductStatus.INACTIVE;
    await this.productRepository.save(product);

    // Invalidate cache
    await this.invalidateProductCaches(id);
  }

  @CacheInvalidate([CACHE_PATTERNS.PRODUCTS])
  async updateInventory(id: string, data: UpdateInventoryDto): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    // Update inventory
    product.stock = data.stock;
    if (data.minimum_stock !== undefined) {
      product.minimum_stock = data.minimum_stock;
    }

    await this.productRepository.save(product);

    // Invalidate cache
    await this.invalidateProductCaches(id);
  }

  @CacheInvalidate([CACHE_PATTERNS.PRODUCTS])
  async bulkAction(data: BulkProductActionDto): Promise<void> {
    const { product_ids, action } = data;

    // Verify all products exist
    const products = await this.productRepository.find({
      where: { id: In(product_ids) },
    });

    if (products.length !== product_ids.length) {
      throw new BadRequestException("Some products not found");
    }

    // Perform bulk action
    switch (action) {
      case "activate":
        await this.productRepository.update(
          { id: In(product_ids) },
          { status: ProductStatus.ACTIVE },
        );
        break;
      case "deactivate":
        await this.productRepository.update(
          { id: In(product_ids) },
          { status: ProductStatus.INACTIVE },
        );
        break;
      case "delete":
        await this.productRepository.update(
          { id: In(product_ids) },
          { status: ProductStatus.INACTIVE },
        );
        break;
      case "feature":
        await this.productRepository.update(
          { id: In(product_ids) },
          { featured: true },
        );
        break;
      case "unfeature":
        await this.productRepository.update(
          { id: In(product_ids) },
          { featured: false },
        );
        break;
      default:
        throw new BadRequestException("Invalid bulk action");
    }

    // Invalidate cache
    await this.invalidateProductCaches();
  }

  async exportProducts(data: ExportProductsDto): Promise<ExportResultDto> {
    // This is a simplified implementation
    // In a real application, you would use a background job queue
    const exportId = `export_${Date.now()}`;

    // For now, return a mock response
    // In production, this would trigger a background job and use the data parameter
    return {
      export_id: exportId,
      status: "processing",
      total_records: 0,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  async getProductAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ProductAnalyticsDto> {
    const cacheKey = this.generateCacheKey(CACHE_KEYS.PRODUCT_ANALYTICS, {
      dateFrom,
      dateTo,
    });

    // Try to get from cache first
    const cached = await this.cacheService.get<ProductAnalyticsDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.productRepository.createQueryBuilder("product");

    // Apply date filters if provided
    if (dateFrom) {
      queryBuilder.andWhere("product.created_at >= :dateFrom", { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere("product.created_at <= :dateTo", { dateTo });
    }

    // Get basic counts
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      featuredProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere("product.status = :status", { status: ProductStatus.ACTIVE })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere("product.status = :status", {
          status: ProductStatus.INACTIVE,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere("product.status = :status", { status: ProductStatus.DRAFT })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere("product.featured = :featured", { featured: true })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere(
          "product.stock <= product.minimum_stock AND product.stock > 0",
        )
        .getCount(),
      queryBuilder.clone().andWhere("product.stock = 0").getCount(),
    ]);

    // Get inventory value and average price
    const inventoryStats = await queryBuilder
      .select([
        "SUM(product.price * product.stock) as total_inventory_value",
        "AVG(product.price) as average_price",
      ])
      .getRawOne();

    // Get top selling products
    const topSellingProducts = await this.productRepository
      .createQueryBuilder("product")
      .select([
        "product.id",
        "product.name",
        "product.sales_count",
        "(product.price * product.sales_count) as revenue",
      ])
      .orderBy("product.sales_count", "DESC")
      .limit(10)
      .getRawMany();

    // Get category distribution
    const categoryDistribution = await this.productRepository
      .createQueryBuilder("product")
      .leftJoin("product.category", "category")
      .select([
        "category.id as category_id",
        "category.name as category_name",
        "COUNT(product.id) as product_count",
      ])
      .groupBy("category.id, category.name")
      .getRawMany();

    // Calculate percentages for category distribution
    const categoryDistributionWithPercentage = categoryDistribution.map(
      (item) => ({
        category_id: item.category_id,
        category_name: item.category_name,
        product_count: parseInt(item.product_count),
        percentage:
          totalProducts > 0
            ? (parseInt(item.product_count) / totalProducts) * 100
            : 0,
      }),
    );

    // Get price distribution
    const priceDistribution = await Promise.all([
      queryBuilder.clone().andWhere("product.price < 100").getCount(),
      queryBuilder
        .clone()
        .andWhere("product.price >= 100 AND product.price < 500")
        .getCount(),
      queryBuilder
        .clone()
        .andWhere("product.price >= 500 AND product.price < 1000")
        .getCount(),
      queryBuilder.clone().andWhere("product.price >= 1000").getCount(),
    ]);

    const analytics: ProductAnalyticsDto = {
      total_products: totalProducts,
      active_products: activeProducts,
      inactive_products: inactiveProducts,
      draft_products: draftProducts,
      featured_products: featuredProducts,
      low_stock_products: lowStockProducts,
      out_of_stock_products: outOfStockProducts,
      total_inventory_value:
        parseFloat(inventoryStats.total_inventory_value) || 0,
      average_price: parseFloat(inventoryStats.average_price) || 0,
      top_selling_products: topSellingProducts.map((item) => ({
        id: item.product_id,
        name: item.product_name,
        sales_count: item.product_sales_count,
        revenue: parseFloat(item.revenue) || 0,
      })),
      category_distribution: categoryDistributionWithPercentage,
      stock_distribution: {
        in_stock: totalProducts - outOfStockProducts,
        low_stock: lowStockProducts,
        out_of_stock: outOfStockProducts,
      },
      price_distribution: {
        under_100: priceDistribution[0],
        between_100_500: priceDistribution[1],
        between_500_1000: priceDistribution[2],
        over_1000: priceDistribution[3],
      },
    };

    // Cache the result
    await this.cacheService.set(
      cacheKey,
      analytics,
      CACHE_TTL.PRODUCT_ANALYTICS,
    );

    return analytics;
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    filters: {
      search?: string;
      category_id?: string;
      status?: ProductStatus;
      featured?: boolean;
      min_price?: number;
      max_price?: number;
      min_stock?: number;
      max_stock?: number;
      date_from?: string;
      date_to?: string;
      tags?: string[];
    },
  ): void {
    const {
      search,
      category_id,
      status,
      featured,
      min_price,
      max_price,
      min_stock,
      max_stock,
      date_from,
      date_to,
      tags,
    } = filters;

    if (search) {
      queryBuilder.andWhere(
        "(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (category_id) {
      queryBuilder.andWhere("product.category_id = :category_id", {
        category_id,
      });
    }

    if (status) {
      queryBuilder.andWhere("product.status = :status", { status });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere("product.featured = :featured", { featured });
    }

    if (min_price !== undefined) {
      queryBuilder.andWhere("product.price >= :min_price", { min_price });
    }

    if (max_price !== undefined) {
      queryBuilder.andWhere("product.price <= :max_price", { max_price });
    }

    if (min_stock !== undefined) {
      queryBuilder.andWhere("product.stock >= :min_stock", { min_stock });
    }

    if (max_stock !== undefined) {
      queryBuilder.andWhere("product.stock <= :max_stock", { max_stock });
    }

    if (date_from) {
      queryBuilder.andWhere("product.created_at >= :date_from", { date_from });
    }

    if (date_to) {
      queryBuilder.andWhere("product.created_at <= :date_to", { date_to });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere("product.tags && :tags", { tags });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    sortBy: string,
    sortOrder: string,
  ): void {
    const order = sortOrder.toUpperCase() as "ASC" | "DESC";

    switch (sortBy) {
      case "name":
        queryBuilder.orderBy("product.name", order);
        break;
      case "price":
        queryBuilder.orderBy("product.price", order);
        break;
      case "stock":
        queryBuilder.orderBy("product.stock", order);
        break;
      case "sales_count":
        queryBuilder.orderBy("product.sales_count", order);
        break;
      case "rating":
        queryBuilder.orderBy("product.rating", order);
        break;
      case "created_at":
      default:
        queryBuilder.orderBy("product.created_at", order);
        break;
    }
  }

  private async transformToProductDetailsDto(
    product: Product,
  ): Promise<ProductDetailsDto> {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images,
      rating: product.rating,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      status: product.status,
      featured: product.featured,
      tags: product.tags,
      category_id: product.category_id,
      category: {
        id: product.category?.id || product.category_id,
        name: product.category?.name || 'Unknown Category',
      },
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }

  private generateCacheKey(
    prefix: string,
    params: Record<string, any>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          if (params[key] !== undefined && params[key] !== null) {
            result[key] = params[key];
          }
          return result;
        },
        {} as Record<string, any>,
      );

    const paramString =
      Object.keys(sortedParams).length > 0
        ? `:${Buffer.from(JSON.stringify(sortedParams)).toString("base64")}`
        : "";

    return `${prefix}${paramString}`;
  }

  private async invalidateProductCaches(productId?: string): Promise<void> {
    try {
      // Invalidate list cache
      await this.cacheService.delPattern(`${CACHE_KEYS.PRODUCT_LIST}*`);

      // Invalidate analytics cache
      await this.cacheService.delPattern(`${CACHE_KEYS.PRODUCT_ANALYTICS}*`);

      // Invalidate specific product cache if ID provided
      if (productId) {
        await this.cacheService.del(
          `${CACHE_KEYS.PRODUCT_DETAILS}:${productId}`,
        );
      }
    } catch (error) {
      // Log error but don't throw - cache invalidation failure shouldn't break the operation
      console.error("Failed to invalidate product caches:", error);
    }
  }
}
