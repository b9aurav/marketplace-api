import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import * as request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { AdminModule } from "../src/admin/admin.module";
import { AuthModule } from "../src/auth/auth.module";
import { UsersModule } from "../src/users/users.module";
import { ProductsModule } from "../src/products/products.module";
import { CacheModule } from "../src/common/cache/cache.module";
import { User } from "../src/users/entities/user.entity";
import { Role } from "@/common/decorators/roles.decorator";
import {
  Product,
  ProductStatus,
} from "../src/products/entities/product.entity";
import { Category } from "../src/products/entities/category.entity";
import { AdminExceptionFilter } from "../src/admin/filters/admin-exception.filter";

describe("Admin Product Management (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let jwtService: JwtService;
  let adminToken: string;
  let testUser: User;
  let testCategory: Category;
  let testProduct: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env.test",
        }),
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [User, Product, Category],
          synchronize: true,
          logging: false,
        }),
        AuthModule,
        UsersModule,
        ProductsModule,
        AdminModule,
        CacheModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new AdminExceptionFilter());

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test admin user
    testUser = await userRepository.save({
      email: "admin@test.com",
      password: "hashedpassword",
      first_name: "Admin",
      last_name: "User",
      role: Role.ADMIN,
      is_active: true,
      last_login_at: new Date(),
      metadata: {},
    });

    // Generate admin token
    adminToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });

    // Create test category
    testCategory = await categoryRepository.save({
      name: "Test Category",
      description: "Test Category Description",
      image: "category.jpg",
    });

    // Create test product
    testProduct = await productRepository.save({
      name: "Test Product",
      description: "Test Product Description",
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
      category_id: testCategory.id,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/api/admin/products (GET)", () => {
    it("should return paginated products for admin", () => {
      return request(app.getHttpServer())
        .get("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("data");
          expect(res.body).toHaveProperty("pagination");
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toHaveProperty("total");
          expect(res.body.pagination).toHaveProperty("page");
          expect(res.body.pagination).toHaveProperty("limit");
          expect(res.body.pagination).toHaveProperty("total_pages");
        });
    });

    it("should filter products by search term", () => {
      return request(app.getHttpServer())
        .get("/api/admin/products?search=Test")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0].name).toContain("Test");
        });
    });

    it("should filter products by status", () => {
      return request(app.getHttpServer())
        .get(`/api/admin/products?status=${ProductStatus.ACTIVE}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          res.body.data.forEach((product: any) => {
            expect(product.status).toBe(ProductStatus.ACTIVE);
          });
        });
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer())
        .get("/api/admin/products")
        .expect(401);
    });
  });

  describe("/api/admin/products/analytics (GET)", () => {
    it("should return product analytics for admin", () => {
      return request(app.getHttpServer())
        .get("/api/admin/products/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("total_products");
          expect(res.body).toHaveProperty("active_products");
          expect(res.body).toHaveProperty("inactive_products");
          expect(res.body).toHaveProperty("draft_products");
          expect(res.body).toHaveProperty("featured_products");
          expect(res.body).toHaveProperty("low_stock_products");
          expect(res.body).toHaveProperty("out_of_stock_products");
          expect(res.body).toHaveProperty("total_inventory_value");
          expect(res.body).toHaveProperty("average_price");
          expect(res.body).toHaveProperty("top_selling_products");
          expect(res.body).toHaveProperty("category_distribution");
          expect(res.body).toHaveProperty("stock_distribution");
          expect(res.body).toHaveProperty("price_distribution");
        });
    });

    it("should filter analytics by date range", () => {
      const dateFrom = "2023-01-01";
      const dateTo = "2023-12-31";

      return request(app.getHttpServer())
        .get(
          `/api/admin/products/analytics?date_from=${dateFrom}&date_to=${dateTo}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe("/api/admin/products/:id (GET)", () => {
    it("should return product details for admin", () => {
      return request(app.getHttpServer())
        .get(`/api/admin/products/${testProduct.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testProduct.id);
          expect(res.body.name).toBe(testProduct.name);
          expect(res.body.sku).toBe(testProduct.sku);
          expect(res.body).toHaveProperty("low_stock");
          expect(res.body).toHaveProperty("category_name");
          expect(res.body).toHaveProperty("total_reviews");
        });
    });

    it("should return 404 for non-existent product", () => {
      return request(app.getHttpServer())
        .get("/api/admin/products/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("/api/admin/products (POST)", () => {
    it("should create a new product", () => {
      const newProduct = {
        name: "New Test Product",
        description: "New Test Product Description",
        price: 199.99,
        stock: 20,
        images: ["new-image.jpg"],
        category_id: testCategory.id,
        sku: "NEW-TEST-001",
        weight: 2.0,
        dimensions: { length: 15, width: 10, height: 5 },
        status: ProductStatus.ACTIVE,
        featured: true,
        tags: ["new", "test"],
        meta_title: "New Test Meta Title",
        meta_description: "New Test Meta Description",
        minimum_stock: 10,
      };

      return request(app.getHttpServer())
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(newProduct.name);
          expect(res.body.sku).toBe(newProduct.sku);
          expect(res.body.price).toBe(newProduct.price);
          expect(res.body.featured).toBe(newProduct.featured);
        });
    });

    it("should return 409 for duplicate SKU", () => {
      const duplicateProduct = {
        name: "Duplicate Product",
        description: "Duplicate Product Description",
        price: 99.99,
        stock: 10,
        images: ["image.jpg"],
        category_id: testCategory.id,
        sku: testProduct.sku, // Using existing SKU
      };

      return request(app.getHttpServer())
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(duplicateProduct)
        .expect(409);
    });

    it("should return 400 for invalid category", () => {
      const invalidProduct = {
        name: "Invalid Product",
        description: "Invalid Product Description",
        price: 99.99,
        stock: 10,
        images: ["image.jpg"],
        category_id: "123e4567-e89b-12d3-a456-426614174999", // Non-existent category
        sku: "INVALID-001",
      };

      return request(app.getHttpServer())
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe("/api/admin/products/:id (PUT)", () => {
    it("should update a product", () => {
      const updateData = {
        name: "Updated Test Product",
        price: 149.99,
        featured: true,
      };

      return request(app.getHttpServer())
        .put(`/api/admin/products/${testProduct.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.price).toBe(updateData.price);
          expect(res.body.featured).toBe(updateData.featured);
        });
    });

    it("should return 404 for non-existent product", () => {
      return request(app.getHttpServer())
        .put("/api/admin/products/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" })
        .expect(404);
    });
  });

  describe("/api/admin/products/:id (DELETE)", () => {
    it("should soft delete a product", async () => {
      // Create a product to delete
      const productToDelete = await productRepository.save({
        name: "Product to Delete",
        description: "This product will be deleted",
        price: 50.0,
        stock: 5,
        images: ["delete-image.jpg"],
        rating: 3.0,
        sku: "DELETE-001",
        weight: 1.0,
        dimensions: { length: 5, width: 5, height: 5 },
        status: ProductStatus.ACTIVE,
        featured: false,
        tags: ["delete"],
        meta_title: "Delete Meta Title",
        meta_description: "Delete Meta Description",
        minimum_stock: 2,
        sales_count: 0,
        category_id: testCategory.id,
      });

      return request(app.getHttpServer())
        .delete(`/api/admin/products/${productToDelete.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204);
    });

    it("should return 404 for non-existent product", () => {
      return request(app.getHttpServer())
        .delete("/api/admin/products/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("/api/admin/products/:id/inventory (PATCH)", () => {
    it("should update product inventory", () => {
      const inventoryUpdate = {
        stock: 50,
        minimum_stock: 15,
        reason: "Restocking",
      };

      return request(app.getHttpServer())
        .patch(`/api/admin/products/${testProduct.id}/inventory`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(inventoryUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe("Inventory updated successfully");
        });
    });

    it("should return 404 for non-existent product", () => {
      return request(app.getHttpServer())
        .patch(
          "/api/admin/products/123e4567-e89b-12d3-a456-426614174999/inventory",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ stock: 10 })
        .expect(404);
    });
  });

  describe("/api/admin/products/bulk-action (POST)", () => {
    it("should perform bulk activate action", async () => {
      // Create additional products for bulk action
      const product1 = await productRepository.save({
        name: "Bulk Product 1",
        description: "Bulk Product 1 Description",
        price: 25.0,
        stock: 5,
        images: ["bulk1.jpg"],
        rating: 3.5,
        sku: "BULK-001",
        weight: 0.5,
        dimensions: { length: 3, width: 3, height: 3 },
        status: ProductStatus.INACTIVE,
        featured: false,
        tags: ["bulk"],
        meta_title: "Bulk 1 Meta Title",
        meta_description: "Bulk 1 Meta Description",
        minimum_stock: 2,
        sales_count: 0,
        category_id: testCategory.id,
      });

      const product2 = await productRepository.save({
        name: "Bulk Product 2",
        description: "Bulk Product 2 Description",
        price: 35.0,
        stock: 8,
        images: ["bulk2.jpg"],
        rating: 4.0,
        sku: "BULK-002",
        weight: 0.8,
        dimensions: { length: 4, width: 4, height: 4 },
        status: ProductStatus.INACTIVE,
        featured: false,
        tags: ["bulk"],
        meta_title: "Bulk 2 Meta Title",
        meta_description: "Bulk 2 Meta Description",
        minimum_stock: 3,
        sales_count: 0,
        category_id: testCategory.id,
      });

      const bulkAction = {
        product_ids: [product1.id, product2.id],
        action: "activate",
      };

      return request(app.getHttpServer())
        .post("/api/admin/products/bulk-action")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(bulkAction)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe("Bulk action completed successfully");
        });
    });

    it("should return 400 for invalid action", () => {
      const bulkAction = {
        product_ids: [testProduct.id],
        action: "invalid_action",
      };

      return request(app.getHttpServer())
        .post("/api/admin/products/bulk-action")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(bulkAction)
        .expect(400);
    });
  });

  describe("/api/admin/products/export (POST)", () => {
    it("should initiate product export", () => {
      const exportRequest = {
        format: "csv",
        status: ProductStatus.ACTIVE,
        fields: ["name", "sku", "price", "stock"],
      };

      return request(app.getHttpServer())
        .post("/api/admin/products/export")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(exportRequest)
        .expect(202)
        .expect((res) => {
          expect(res.body).toHaveProperty("export_id");
          expect(res.body).toHaveProperty("status");
          expect(res.body.status).toBe("processing");
          expect(res.body).toHaveProperty("created_at");
        });
    });
  });
});
