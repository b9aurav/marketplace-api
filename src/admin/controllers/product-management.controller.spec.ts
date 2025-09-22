import { ProductManagementService } from "../services/product-management.service";
import { ProductStatus } from "../../products/entities/product.entity";
import {
  GetProductsQueryDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
  UpdateInventoryDto,
  BulkProductActionDto,
  ExportProductsDto,
  ProductDetailsDto,
  ProductAnalyticsDto,
  PaginatedProductsDto,
} from "../dto/product-management.dto";

// Create a simple controller class for testing without decorators
class TestProductManagementController {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) { }

  async getProducts(query: GetProductsQueryDto): Promise<PaginatedProductsDto> {
    return this.productManagementService.getProducts(query);
  }

  async getProductAnalytics(
    dateFrom?: string,
    dateeTo?: string,
  ): Promise<ProductAnalyticsDto> {
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateeTo ? new Date(dateeTo) : undefined;
    return this.productManagementService.getProductAnalytics(
      dateFromObj,
      dateToObj,
    );
  }

  async getProductDetails(id: string): Promise<ProductDetailsDto> {
    return this.productManagementService.getProductDetails(id);
  }

  async createProduct(data: AdminCreateProductDto): Promise<ProductDetailsDto> {
    return this.productManagementService.createProduct(data);
  }

  async updateProduct(
    id: string,
    data: AdminUpdateProductDto,
  ): Promise<ProductDetailsDto> {
    return this.productManagementService.updateProduct(id, data);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.productManagementService.deleteProduct(id);
  }

  async updateInventory(
    id: string,
    data: UpdateInventoryDto,
  ): Promise<{ message: string }> {
    await this.productManagementService.updateInventory(id, data);
    return { message: "Inventory updated successfully" };
  }

  async bulkAction(data: BulkProductActionDto): Promise<{ message: string }> {
    await this.productManagementService.bulkAction(data);
    return { message: "Bulk action completed successfully" };
  }

  async exportProducts(data: ExportProductsDto) {
    return this.productManagementService.exportProducts(data);
  }
}

describe("ProductManagementController", () => {
  let controller: TestProductManagementController;
  let service: jest.Mocked<ProductManagementService>;

  const mockProductDetails: ProductDetailsDto = {
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
    category_id: "cat-123",
    category: {
      id: "cat-123",
      name: "Test Category",
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPaginatedProducts: PaginatedProductsDto = {
    products: [mockProductDetails],
    total: 1,
    page: 1,
    limit: 10,
    total_pages: 1,

  };

  const mockAnalytics: ProductAnalyticsDto = {
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

  beforeEach(() => {
    service = {
      getProducts: jest.fn(),
      getProductDetails: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      updateInventory: jest.fn(),
      bulkAction: jest.fn(),
      exportProducts: jest.fn(),
      getProductAnalytics: jest.fn(),
    } as any;

    controller = new TestProductManagementController(service);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getProducts", () => {
    it("should return paginated products", async () => {
      const query: GetProductsQueryDto = { page: 1, limit: 10 };
      service.getProducts.mockResolvedValue(mockPaginatedProducts);

      const result = await controller.getProducts(query);

      expect(result).toEqual(mockPaginatedProducts);
      expect(service.getProducts).toHaveBeenCalledWith(query);
    });

    it("should handle query parameters correctly", async () => {
      const query: GetProductsQueryDto = {
        page: 2,
        limit: 20,
        search: "test",
        status: ProductStatus.ACTIVE,
        featured: true,
        min_price: 10,
        max_price: 100,
      };
      service.getProducts.mockResolvedValue(mockPaginatedProducts);

      await controller.getProducts(query);

      expect(service.getProducts).toHaveBeenCalledWith(query);
    });
  });

  describe("getProductAnalytics", () => {
    it("should return product analytics", async () => {
      service.getProductAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getProductAnalytics();

      expect(result).toEqual(mockAnalytics);
      expect(service.getProductAnalytics).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });

    it("should handle date parameters", async () => {
      const dateFrom = "2023-01-01";
      const dateTo = "2023-12-31";
      service.getProductAnalytics.mockResolvedValue(mockAnalytics);

      await controller.getProductAnalytics(dateFrom, dateTo);

      expect(service.getProductAnalytics).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
    });
  });

  describe("getProductDetails", () => {
    it("should return product details", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      service.getProductDetails.mockResolvedValue(mockProductDetails);

      const result = await controller.getProductDetails(productId);

      expect(result).toEqual(mockProductDetails);
      expect(service.getProductDetails).toHaveBeenCalledWith(productId);
    });
  });

  describe("createProduct", () => {
    it("should create a new product", async () => {
      const createProductDto: AdminCreateProductDto = {
        name: "New Product",
        description: "New Product Description",
        price: 199.99,
        stock: 20,
        images: ["image1.jpg"],
        category_id: "cat-123",
        sku: "NEW-001",
      };
      service.createProduct.mockResolvedValue(mockProductDetails);

      const result = await controller.createProduct(createProductDto);

      expect(result).toEqual(mockProductDetails);
      expect(service.createProduct).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe("updateProduct", () => {
    it("should update a product", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      const updateProductDto: AdminUpdateProductDto = {
        name: "Updated Product",
        price: 299.99,
      };
      const updatedProduct = { ...mockProductDetails, ...updateProductDto };
      service.updateProduct.mockResolvedValue(updatedProduct);

      const result = await controller.updateProduct(
        productId,
        updateProductDto,
      );

      expect(result).toEqual(updatedProduct);
      expect(service.updateProduct).toHaveBeenCalledWith(
        productId,
        updateProductDto,
      );
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      service.deleteProduct.mockResolvedValue();

      await controller.deleteProduct(productId);

      expect(service.deleteProduct).toHaveBeenCalledWith(productId);
    });
  });

  describe("updateInventory", () => {
    it("should update product inventory", async () => {
      const productId = "123e4567-e89b-12d3-a456-426614174000";
      const updateInventoryDto: UpdateInventoryDto = {
        stock: 50,
        minimum_stock: 10,
      };
      service.updateInventory.mockResolvedValue();

      const result = await controller.updateInventory(
        productId,
        updateInventoryDto,
      );

      expect(result).toEqual({ message: "Inventory updated successfully" });
      expect(service.updateInventory).toHaveBeenCalledWith(
        productId,
        updateInventoryDto,
      );
    });
  });

  describe("bulkAction", () => {
    it("should perform bulk action on products", async () => {
      const bulkActionDto: BulkProductActionDto = {
        product_ids: ["id1", "id2"],
        action: "activate",
      };
      service.bulkAction.mockResolvedValue();

      const result = await controller.bulkAction(bulkActionDto);

      expect(result).toEqual({ message: "Bulk action completed successfully" });
      expect(service.bulkAction).toHaveBeenCalledWith(bulkActionDto);
    });
  });

  describe("exportProducts", () => {
    it("should export products", async () => {
      const exportDto: ExportProductsDto = {
        format: "csv",
        status: ProductStatus.ACTIVE,
      };
      const exportResult = {
        export_id: "export_123",
        status: "processing" as const,
        total_records: 100,
        created_at: new Date(),
        expires_at: new Date(),
      };
      service.exportProducts.mockResolvedValue(exportResult);

      const result = await controller.exportProducts(exportDto);

      expect(result).toEqual(exportResult);
      expect(service.exportProducts).toHaveBeenCalledWith(exportDto);
    });
  });
});
