import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ProductsService } from "./products.service";
import { Product } from "./entities/product.entity";
import { Category } from "./entities/category.entity";
import { Review } from "./entities/review.entity";
import { NotFoundException } from "@nestjs/common";
import { FindProductsDto } from "./dto/find-products.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SortOption } from "./dto/find-products.dto";

describe("ProductsService", () => {
  let service: ProductsService;
  let productsRepository: any;

  const mockProductsRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };
  const mockCategoriesRepository = {};
  const mockReviewsRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoriesRepository,
        },
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewsRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated products with filters and sorting", async () => {
      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([{ id: "1", name: "Product 1" }]),
      };
      productsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      const dto: FindProductsDto = {
        category: "cat1",
        min_price: 10,
        max_price: 100,
        sort: SortOption.PRICE_ASC,
        page: 1,
        limit: 10,
      };
      const result = await service.findAll(dto);
      expect(result).toEqual({
        data: [{ id: "1", name: "Product 1" }],
        pagination: { total: 1, page: 1, limit: 10 },
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });
  });

  describe("findOne", () => {
    it("should return a product with relations", async () => {
      const mockProduct = { id: "1", name: "Product 1", reviews: [] };
      productsRepository.findOne.mockResolvedValue(mockProduct);
      const result = await service.findOne("1");
      expect(result).toEqual(mockProduct);
      expect(productsRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
        relations: ["reviews", "reviews.user"],
      });
    });
    it("should throw NotFoundException if product not found", async () => {
      productsRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne("1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getTrending", () => {
    it("should return top 10 products by rating", async () => {
      const mockProducts = [{ id: "1", rating: 5 }];
      productsRepository.find.mockResolvedValue(mockProducts);
      const result = await service.getTrending();
      expect(result).toEqual(mockProducts);
      expect(productsRepository.find).toHaveBeenCalledWith({
        order: { rating: "DESC" },
        take: 10,
      });
    });
  });

  describe("create", () => {
    it("should create and save a product", async () => {
      const dto: CreateProductDto = {
        name: "P",
        description: "D",
        price: 1,
        stock: 1,
        images: ["img"],
        category_id: "cat",
      };
      const mockProduct = { ...dto };
      productsRepository.create.mockReturnValue(mockProduct);
      productsRepository.save.mockResolvedValue(mockProduct);
      const result = await service.create(dto);
      expect(result).toEqual(mockProduct);
      expect(productsRepository.create).toHaveBeenCalledWith(dto);
      expect(productsRepository.save).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe("update", () => {
    it("should update and save a product", async () => {
      const dto: UpdateProductDto = { name: "New" };
      const mockProduct = { id: "1", name: "Old" };
      jest.spyOn(service, "findOne").mockResolvedValue(mockProduct as any);
      productsRepository.save.mockResolvedValue({ ...mockProduct, ...dto });
      const result = await service.update("1", dto);
      expect(result).toEqual({ ...mockProduct, ...dto });
      expect(productsRepository.save).toHaveBeenCalledWith({
        ...mockProduct,
        ...dto,
      });
    });
  });
});
