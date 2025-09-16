import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { NotFoundException } from "@nestjs/common";
import { FindProductsDto } from "./dto/find-products.dto";

describe("ProductsController", () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    findAll: jest.fn(),
    getTrending: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all products with filters", async () => {
      const dto: FindProductsDto = {
        category: "cat",
        min_price: 10,
        max_price: 100,
        sort: "price_asc",
        page: 1,
        limit: 10,
      } as any;
      const mockResult = {
        data: [{ id: "1" }],
        pagination: { total: 1, page: 1, limit: 10 },
      };
      mockProductsService.findAll.mockResolvedValue(mockResult);
      const result = await controller.findAll(dto);
      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(dto);
    });
  });

  describe("getTrending", () => {
    it("should return trending products", async () => {
      const mockProducts = [{ id: "1", rating: 5 }];
      mockProductsService.getTrending.mockResolvedValue(mockProducts);
      const result = await controller.getTrending();
      expect(result).toEqual(mockProducts);
      expect(service.getTrending).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a product by id", async () => {
      const mockProduct = { id: "1", name: "Product 1" };
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      const result = await controller.findOne("1");
      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith("1");
    });
    it("should throw NotFoundException if product not found", async () => {
      mockProductsService.findOne.mockResolvedValue(null);
      await expect(controller.findOne("1")).rejects.toThrow(NotFoundException);
    });
  });
});
