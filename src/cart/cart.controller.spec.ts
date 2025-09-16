import { Test, TestingModule } from "@nestjs/testing";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { ApplyCouponDto } from "./dto/apply-coupon.dto";

describe("CartController", () => {
  let controller: CartController;
  let service: CartService;

  const mockCartService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    applyCoupon: jest.fn(),
  };

  const mockUser = {
    id: "user-uuid-1234",
    email: "user@example.com",
  };

  const mockCart = {
    items: [
      {
        id: "item-uuid-1234",
        product_id: "prod-uuid-1234",
        quantity: 2,
        price: 100,
        product: {
          id: "prod-uuid-1234",
          name: "Test Product",
        },
      },
    ],
    total: 200,
  };

  const mockCartItem = {
    id: "item-uuid-1234",
    cart_id: "cart-uuid-1234",
    product_id: "prod-uuid-1234",
    quantity: 2,
    price: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService);
  });

  describe("getCart", () => {
    it("should return user cart", async () => {
      mockCartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart({ user: mockUser });

      expect(result).toEqual(mockCart);
      expect(service.getCart).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe("addItem", () => {
    it("should add item to cart", async () => {
      const addCartItemDto: AddCartItemDto = {
        product_id: "prod-uuid-1234",
        quantity: 2,
      };

      mockCartService.addItem.mockResolvedValue(mockCartItem);

      const result = await controller.addItem(
        { user: mockUser },
        addCartItemDto,
      );

      expect(result).toEqual(mockCartItem);
      expect(service.addItem).toHaveBeenCalledWith(mockUser.id, addCartItemDto);
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", async () => {
      const itemId = "item-uuid-1234";

      mockCartService.removeItem.mockResolvedValue(undefined);

      const result = await controller.removeItem({ user: mockUser }, itemId);

      expect(result).toBeNull();
      expect(service.removeItem).toHaveBeenCalledWith(mockUser.id, itemId);
    });
  });

  describe("applyCoupon", () => {
    it("should apply coupon to cart", async () => {
      const applyCouponDto: ApplyCouponDto = {
        code: "SAVE10",
      };

      const expectedResult = {
        discounted_total: 180, // 200 - 10% discount
      };

      mockCartService.applyCoupon.mockResolvedValue(expectedResult);

      const result = await controller.applyCoupon(
        { user: mockUser },
        applyCouponDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.applyCoupon).toHaveBeenCalledWith(
        mockUser.id,
        applyCouponDto.code,
      );
    });
  });
});
