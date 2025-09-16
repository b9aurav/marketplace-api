import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "./entities/product.entity";
import { Category } from "./entities/category.entity";
import { Review } from "./entities/review.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { FindProductsDto } from "./dto/find-products.dto";
import { PaginatedResult } from "../common/dto/pagination.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async findAll(
    findProductsDto: FindProductsDto,
  ): Promise<PaginatedResult<Product>> {
    const {
      category,
      min_price,
      max_price,
      sort,
      page = 1,
      limit = 20,
    } = findProductsDto;

    const queryBuilder = this.productsRepository.createQueryBuilder("product");

    // Apply filters
    if (category) {
      queryBuilder.andWhere("product.category_id = :category", { category });
    }

    if (min_price) {
      queryBuilder.andWhere("product.price >= :min_price", { min_price });
    }

    if (max_price) {
      queryBuilder.andWhere("product.price <= :max_price", { max_price });
    }

    // Apply sorting
    if (sort) {
      switch (sort) {
        case "price_asc":
          queryBuilder.orderBy("product.price", "ASC");
          break;
        case "price_desc":
          queryBuilder.orderBy("product.price", "DESC");
          break;
        case "newest":
          queryBuilder.orderBy("product.created_at", "DESC");
          break;
        case "rating":
          queryBuilder.orderBy("product.rating", "DESC");
          break;
        default:
          queryBuilder.orderBy("product.created_at", "DESC");
      }
    } else {
      queryBuilder.orderBy("product.created_at", "DESC");
    }

    // Add pagination
    const total = await queryBuilder.getCount();

    queryBuilder.take(limit).skip((page - 1) * limit);

    const products = await queryBuilder.getMany();

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ["reviews", "reviews.user"],
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  async getTrending(): Promise<Product[]> {
    return this.productsRepository.find({
      order: { rating: "DESC" },
      take: 10,
    });
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Update product properties
    Object.assign(product, updateProductDto);

    return this.productsRepository.save(product);
  }

  async createCategory(createCategoryDto: {
    name: string;
    description?: string;
    image?: string;
  }): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async getCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: {
        name: "ASC",
      },
    });
  }
}
