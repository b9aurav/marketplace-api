import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { CartModule } from "../src/cart/cart.module";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../src/common/guards/roles.guard";
import { Role } from "../src/common/decorators/roles.decorator";
import { User } from "../src/users/entities/user.entity";
import { Cart } from "../src/cart/entities/cart.entity";
import { CartItem } from "../src/cart/entities/cart-item.entity";
import { Product } from "../src/products/entities/product.entity";
import { Category } from "../src/products/entities/category.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Review } from "../src/products/entities/review.entity";

describe("CartController (e2e)", () => {
  let app: INestApplication;

  const mockUser: Partial<User> = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    name: "Test User",
    role: Role.USER,
    created_at: new Date(),
    updated_at: new Date(),
    phone: null,
    addresses: [],
    orders: [],
  };

  const mockProduct: Partial<Product> = {
    id: "123e4567-e89b-12d3-a456-426614174001",
    name: "Test Product",
    description: "Test Description",
    price: 100,
    stock: 10,
    images: ["test.jpg"],
    category_id: "123e4567-e89b-12d3-a456-426614174002",
    rating: 0,
    created_at: new Date(),
    updated_at: new Date(),
    category: null,
    reviews: [],
  };

  const mockCartItem: Partial<CartItem> = {
    id: "123e4567-e89b-12d3-a456-426614174004",
    cart_id: "123e4567-e89b-12d3-a456-426614174003",
    product_id: mockProduct.id,
    quantity: 2,
    price: 100,
    cart: null,
    product: mockProduct as Product,
  };

  const mockCart: Partial<Cart> = {
    id: "123e4567-e89b-12d3-a456-426614174003",
    user_id: mockUser.id,
    items: [mockCartItem as CartItem],
    discount_amount: 0,
    coupon_code: null,
  };

  const mockCartRepository = {
    findOne: jest.fn().mockResolvedValue(mockCart),
    create: jest
      .fn()
      .mockImplementation((data) => ({ ...data, id: "new-cart-id" })),
    save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
  };

  const mockCartItemRepository = {
    create: jest
      .fn()
      .mockImplementation((data) => ({ ...data, id: "new-cart-item-id" })),
    save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    findOne: jest.fn().mockResolvedValue(mockCartItem),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockResolvedValue({}),
  };

  const mockProductRepository = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockReviewRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CartModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation(() => true),
      })
      .overrideProvider(getRepositoryToken(Cart))
      .useValue(mockCartRepository)
      .overrideProvider(getRepositoryToken(CartItem))
      .useValue(mockCartItemRepository)
      .overrideProvider(getRepositoryToken(Product))
      .useValue(mockProductRepository)
      .overrideProvider(getRepositoryToken(Category))
      .useValue(mockCategoryRepository)
      .overrideProvider(getRepositoryToken(Review))
      .useValue(mockReviewRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /cart", () => {
    it("should return cart with items", () => {
      return request(app.getHttpServer())
        .get("/cart")
        .set("Authorization", `Bearer mock-jwt-token`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("items");
          expect(res.body).toHaveProperty("total");
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0]).toHaveProperty("id");
          expect(res.body.items[0]).toHaveProperty("product");
        });
    });
  });

  describe("POST /cart/items", () => {
    it("should add item to cart", () => {
      return request(app.getHttpServer())
        .post("/cart/items")
        .set("Authorization", `Bearer mock-jwt-token`)
        .send({
          product_id: mockProduct.id,
          quantity: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("cart_id");
          expect(res.body).toHaveProperty("product_id");
          expect(res.body).toHaveProperty("quantity");
        });
    });

    it("should return 400 for invalid quantity", () => {
      return request(app.getHttpServer())
        .post("/cart/items")
        .set("Authorization", `Bearer mock-jwt-token`)
        .send({
          product_id: mockProduct.id,
          quantity: 0,
        })
        .expect(400);
    });
  });

  describe("DELETE /cart/items/:id", () => {
    it("should remove item from cart", () => {
      return request(app.getHttpServer())
        .delete(`/cart/items/${mockCartItem.id}`)
        .set("Authorization", `Bearer mock-jwt-token`)
        .expect(204);
    });

    it("should return 404 for non-existent item", async () => {
      // Mock findOne to return null for this test only
      mockCartItemRepository.findOne.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .delete("/cart/items/non-existent")
        .set("Authorization", `Bearer mock-jwt-token`)
        .expect(404);
    });
  });

  describe("POST /cart/apply-coupon", () => {
    it("should apply coupon to cart", () => {
      return request(app.getHttpServer())
        .post("/cart/apply-coupon")
        .set("Authorization", `Bearer mock-jwt-token`)
        .send({
          code: "TEST10",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("discounted_total");
        });
    });

    it("should return 201 for invalid coupon", () => {
      return request(app.getHttpServer())
        .post("/cart/apply-coupon")
        .set("Authorization", `Bearer mock-jwt-token`)
        .send({
          code: "INVALID",
        })
        .expect(201);
    });
  });
});
