import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { ProductManagementService } from "./product-management.service";
import { Product, ProductStatus } from "../../products/entities/product.entity";
import { Category } from "../../products/entities/category.entity";
import { CacheService } from "../../common/cache/cache.service";
import {
  GetProductsQueryDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
  UpdateInventoryDto,
  BulkProductActionDto,
} from "../dto/product-management.dto";

describe("ProductManagementService", () => {
  let service: ProductManagementService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let cacheService: jest.Mocked<CacheService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Product>>;

  const mockProduct: Product = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Test Product",
    description: "Test Description",
    price: 99.99,
    stock: 10,
    images: ["image1.jpg"],
    rating: 4.5,
    sku: "TEST-001",
    weight: 1.5,
    dimensions: { length: 10, width: 5, height: 3 },
    status: ProductStatus.ACTIVE,
    featured: false,
    tags: ["test"],
    meta_title: "Test Meta Title",
    meta_description: "Test Meta Description",
    minimum_stock: 5,
    sales_count: 0,
    category_id: "cat-123",
    created_at: new Date(),
    updated_at: new Date(),
    category: {
      id: "cat-123",
      name: "Test Category",
      description: "Test Category Description",
      image: "category.jpg",
      products: [],
      slug: "",
      is_active: false,
      sort_order: 0,
      parent_id: "",
      parent: new Category(),
      children: [],
      created_at: undefined,
      updated_at: undefined,
    },
    reviews: [],
  };

  const mockCategory = {
    id: "cat-123",
    name: "Test Category",
    description: "Test Category Description",
    image: "category.jpg",
    products: [],
    slug: "",
    is_active: false,
    sort_order: 0,
    parent_id: "",
    parent: new Category(),
    children: [],
    created_at: undefined,
    updated_at: undefined,
  };

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductManagementService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductManagementService>(ProductManagementService);
    productRepository = module.get(getRepositoryToken(Product));
    categoryRepository = module.get(getRepositoryToken(Category));
    cacheService = module.get(CacheService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProducts", () => {
    it("should return cached products if available", async () => {
      const query: GetProductsQueryDto = { page: 1, limit: 10 };
      const cachedResult = {
        data: [mockProduct],
        pagination: { total: 1, page: 1, limit: 10, total_pages: 1 },
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getProducts(query);

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalled();
      expect(productRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should fetch products from database when cache miss", async () => {
      const query: GetProductsQueryDto = { page: 1, limit: 10 };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getCount.mockResolvedValue(1);
      queryBuilder.getMany.mockResolvedValue([mockProduct]);

      const result = await service.getProducts(query);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it("should apply search filter correctly", async () => {
      const query: GetProductsQueryDto = { search: "test", page: 1, limit: 10 };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getProducts(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)",
        { search: "%test%" },
      );
    });

    it("should apply status filter correctly", async () => {
      const query: GetProductsQueryDto = {
        status: ProductStatus.ACTIVE,
        page: 1,
        limit: 10,
      };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getProducts(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "product.status = :status",
        { status: ProductStatus.ACTIVE },
      );
    });
  });

  describe("getProductDetails", () => {
    it("should return cached product details if available", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      const cachedProduct = {
        ...mockProduct,
        low_stock: false,
        category_name: "Test Category",
        total_reviews: 0,
      };

      cacheService.get.mockResolvedValue(cachedProduct);

      const result = await service.getProductDetails(productId);

      expect(result).toEqual(cachedProduct);
      expect(cacheService.get).toHaveBeenCalled();
      expect(productRepository.findOne).not.toHaveBeenCalled();
    });

    it("should fetch product from database when cache miss", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";

      cacheService.get.mockResolvedValue(null);
      productRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.getProductDetails(productId);

      expect(result.id).toBe(productId);
      expect(result.low_stock).toBe(false); // stock (10) > minimum_stock (5), so false
      expect(cacheService.set).toHaveBeenCalled();
    });

    it("should throw NotFoundException when product not found", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";

      cacheService.get.mockResolvedValue(null);
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.getProductDetails(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createProduct", () => {
    const createProductDto: AdminCreateProductDto = {
      name: "New Product",
      description: "New Product Description",
      price: 199.99,
      stock: 20,
      images: ["image1.jpg"],
      category_id: "cat-123",
      sku: "NEW-001",
    };

    it("should create product successfully", async () => {
      productRepository.findOne.mockResolvedValue(null); // No existing product with SKU
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      // Mock getProductDetails call
      cacheService.get.mockResolvedValue(null);
      productRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProduct);

      const result = await service.createProduct(createProductDto);

      expect(result.id).toBe(mockProduct.id);
      expect(productRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        rating: 0,
        sales_count: 0,
      });
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw ConflictException when SKU already exists", async () => {
      productRepository.findOne.mockResolvedValue(mockProduct); // Existing product with SKU

      await expect(service.createProduct(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw BadRequestException when category not found", async () => {
      productRepository.findOne.mockResolvedValue(null); // No existing product with SKU
      categoryRepository.findOne.mockResolvedValue(null); // Category not found

      await expect(service.createProduct(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("updateProduct", () => {
    const updateProductDto: AdminUpdateProductDto = {
      name: "Updated Product",
      price: 299.99,
    };

    it("should update product successfully", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";

      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        ...updateProductDto,
      });

      // Mock getProductDetails call
      cacheService.get.mockResolvedValue(null);
      productRepository.findOne
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ ...mockProduct, ...updateProductDto });

      const result = await service.updateProduct(productId, updateProductDto);

      expect(result.name).toBe(updateProductDto.name);
      expect(result.price).toBe(updateProductDto.price);
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw NotFoundException when product not found", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";

      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProduct(productId, updateProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when updating to existing SKU", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      const updateDto = { sku: "EXISTING-SKU" };
      const existingProduct = { ...mockProduct, sku: "EXISTING-SKU" };

      productRepository.findOne
        .mockResolvedValueOnce(mockProduct) // First call for the product being updated
        .mockResolvedValueOnce(existingProduct); // Second call to check SKU uniqueness

      await expect(service.updateProduct(productId, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("deleteProduct", () => {
    it("should soft delete product successfully", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";

      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        status: ProductStatus.INACTIVE,
      });

      await service.deleteProduct(productId);

      expect(productRepository.save).toHaveBeenCalledWith({
        ...mockProduct,
        status: ProductStatus.INACTIVE,
      });
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw NotFoundException when product not found", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";

      productRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateInventory", () => {
    it("should update inventory successfully", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      const updateInventoryDto: UpdateInventoryDto = {
        stock: 50,
        minimum_stock: 10,
      };

      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        stock: 50,
        minimum_stock: 10,
      });

      await service.updateInventory(productId, updateInventoryDto);

      expect(productRepository.save).toHaveBeenCalledWith({
        ...mockProduct,
        stock: 50,
        minimum_stock: 10,
      });
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw NotFoundException when product not found", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      const updateInventoryDto: UpdateInventoryDto = { stock: 50 };

      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateInventory(productId, updateInventoryDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("bulkAction", () => {
    it("should perform bulk activate action successfully", async () => {
      const bulkActionDto: BulkProductActionDto = {
        product_ids: ["id1", "id2"],
        action: "activate",
      };

      productRepository.find.mockResolvedValue([mockProduct, mockProduct]);
      productRepository.update.mockResolvedValue({ affected: 2 } as any);

      await service.bulkAction(bulkActionDto);

      expect(productRepository.update).toHaveBeenCalledWith(
        { id: expect.any(Object) },
        { status: ProductStatus.ACTIVE },
      );
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw BadRequestException when some products not found", async () => {
      const bulkActionDto: BulkProductActionDto = {
        product_ids: ["id1", "id2"],
        action: "activate",
      };

      productRepository.find.mockResolvedValue([mockProduct]); // Only 1 product found, but 2 requested

      await expect(service.bulkAction(bulkActionDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for invalid action", async () => {
      const bulkActionDto: BulkProductActionDto = {
        product_ids: ["id1"],
        action: "invalid_action",
      };

      productRepository.find.mockResolvedValue([mockProduct]);

      await expect(service.bulkAction(bulkActionDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getProductAnalytics", () => {
    it("should return cached analytics if available", async () => {
      const cachedAnalytics = {
        total_products: 100,
        active_products: 80,
        inactive_products: 15,
        draft_products: 5,
        featured_products: 20,
        low_stock_products: 10,
        out_of_stock_products: 5,
        total_inventory_value: 50000,
        average_price: 150,
        top_selling_products: [],
        category_distribution: [],
        stock_distribution: { in_stock: 95, low_stock: 10, out_of_stock: 5 },
        price_distribution: {
          under_100: 30,
          between_100_500: 50,
          between_500_1000: 15,
          over_1000: 5,
        },
      };

      cacheService.get.mockResolvedValue(cachedAnalytics);

      const result = await service.getProductAnalytics();

      expect(result).toEqual(cachedAnalytics);
      expect(cacheService.get).toHaveBeenCalled();
    });

    it("should calculate analytics from database when cache miss", async () => {
      cacheService.get.mockResolvedValue(null);

      // Mock all the count queries
      queryBuilder.getCount
        .mockResolvedValueOnce(100) // total_products
        .mockResolvedValueOnce(80) // active_products
        .mockResolvedValueOnce(15) // inactive_products
        .mockResolvedValueOnce(5) // draft_products
        .mockResolvedValueOnce(20) // featured_products
        .mockResolvedValueOnce(10) // low_stock_products
        .mockResolvedValueOnce(5) // out_of_stock_products
        .mockResolvedValueOnce(30) // under_100
        .mockResolvedValueOnce(50) // between_100_500
        .mockResolvedValueOnce(15) // between_500_1000
        .mockResolvedValueOnce(5); // over_1000

      queryBuilder.getRawOne.mockResolvedValue({
        total_inventory_value: "50000",
        average_price: "150",
      });

      queryBuilder.getRawMany
        .mockResolvedValueOnce([]) // top_selling_products
        .mockResolvedValueOnce([]); // category_distribution

      const result = await service.getProductAnalytics();

      expect(result.total_products).toBe(100);
      expect(result.active_products).toBe(80);
      expect(result.total_inventory_value).toBe(50000);
      expect(result.average_price).toBe(150);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
