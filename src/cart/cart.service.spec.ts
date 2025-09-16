import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Cart } from "./entities/cart.entity";
import { CartItem } from "./entities/cart-item.entity";
import { ProductsService } from "../products/products.service";

describe("CartService", () => {
  let service: CartService;
  let cartRepository: any;
  let cartItemRepository: any;
  let productsService: any;

  const mockCart = {
    id: "cart-uuid-1234",
    user_id: "user-uuid-1234",
    items: [],
    discount_amount: 0,
  };

  const mockCartItem = {
    id: "item-uuid-1234",
    cart_id: "cart-uuid-1234",
    product_id: "prod-uuid-1234",
    quantity: 2,
    price: 100,
  };

  const mockProduct = {
    id: "prod-uuid-1234",
    name: "Test Product",
    price: 100,
    stock: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(getRepositoryToken(Cart));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
    productsService = module.get(ProductsService);
  });

  describe("getCart", () => {
    it("should return cart with items and total", async () => {
      const cartWithItems = {
        ...mockCart,
        items: [
          {
            ...mockCartItem,
            product: mockProduct,
          },
        ],
      };

      cartRepository.findOne.mockResolvedValueOnce(mockCart);
      cartRepository.findOne.mockResolvedValueOnce(cartWithItems);

      const result = await service.getCart("user-uuid-1234");

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.total).toBe(200); // 2 items * $100
    });

    it("should create new cart if none exists", async () => {
      cartRepository.findOne.mockResolvedValueOnce(null);
      cartRepository.create.mockReturnValue(mockCart);
      cartRepository.save.mockResolvedValue(mockCart);
      cartRepository.findOne.mockResolvedValueOnce({
        ...mockCart,
        items: [],
      });

      const result = await service.getCart("user-uuid-1234");

      expect(cartRepository.create).toHaveBeenCalledWith({
        user_id: "user-uuid-1234",
      });
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.total).toBe(0);
    });
  });

  describe("addItem", () => {
    it("should add new item to cart", async () => {
      productsService.findOne.mockResolvedValue(mockProduct);
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.findOne.mockResolvedValue(null);
      cartItemRepository.create.mockReturnValue(mockCartItem);
      cartItemRepository.save.mockResolvedValue(mockCartItem);

      const result = await service.addItem("user-uuid-1234", {
        product_id: "prod-uuid-1234",
        quantity: 2,
      });

      expect(result).toEqual(mockCartItem);
      expect(cartItemRepository.create).toHaveBeenCalledWith({
        cart_id: mockCart.id,
        product_id: mockProduct.id,
        quantity: 2,
        price: mockProduct.price,
      });
    });

    it("should update existing item quantity", async () => {
      const existingItem = { ...mockCartItem, quantity: 1 };
      productsService.findOne.mockResolvedValue(mockProduct);
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.findOne.mockResolvedValue(existingItem);
      cartItemRepository.save.mockResolvedValue({
        ...existingItem,
        quantity: 3,
      });

      const result = await service.addItem("user-uuid-1234", {
        product_id: "prod-uuid-1234",
        quantity: 2,
      });

      expect(result.quantity).toBe(3);
    });

    it("should throw BadRequestException if not enough stock", async () => {
      productsService.findOne.mockResolvedValue({ ...mockProduct, stock: 1 });

      await expect(
        service.addItem("user-uuid-1234", {
          product_id: "prod-uuid-1234",
          quantity: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);

      await service.removeItem("user-uuid-1234", "item-uuid-1234");

      expect(cartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
    });

    it("should throw NotFoundException if item not found", async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeItem("user-uuid-1234", "non-existent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("applyCoupon", () => {
    it("should apply coupon and return discounted total", async () => {
      const cartWithItems = {
        ...mockCart,
        items: [
          {
            ...mockCartItem,
            product: mockProduct,
          },
        ],
      };

      cartRepository.findOne.mockResolvedValueOnce(mockCart);
      cartRepository.findOne.mockResolvedValueOnce(cartWithItems);
      cartRepository.findOne.mockResolvedValue(cartWithItems);
      cartRepository.save.mockResolvedValue({
        ...mockCart,
        coupon_code: "SAVE10",
        discount_amount: 20,
      });

      const result = await service.applyCoupon("user-uuid-1234", "SAVE10");

      expect(result).toHaveProperty("discounted_total");
      expect(result.discounted_total).toBe(180); // 200 - 10% discount
      expect(cartRepository.save).toHaveBeenCalledWith({
        ...mockCart,
        coupon_code: "SAVE10",
        discount_amount: 20,
      });
    });

    it("should throw BadRequestException for invalid coupon", async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);

      await expect(service.applyCoupon("user-uuid-1234", "A")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("clearCart", () => {
    it("should clear all items and reset coupon", async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.delete.mockResolvedValue({});
      cartRepository.save.mockResolvedValue({});

      await service.clearCart("user-uuid-1234");

      expect(cartItemRepository.delete).toHaveBeenCalledWith({
        cart_id: mockCart.id,
      });
      expect(cartRepository.save).toHaveBeenCalledWith({
        ...mockCart,
        coupon_code: null,
        discount_amount: 0,
      });
    });
  });
});
