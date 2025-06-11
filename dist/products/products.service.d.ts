import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
export declare class ProductsService {
    private productsRepository;
    private categoriesRepository;
    private reviewsRepository;
    constructor(productsRepository: Repository<Product>, categoriesRepository: Repository<Category>, reviewsRepository: Repository<Review>);
    findAll(findProductsDto: FindProductsDto): Promise<PaginatedResult<Product>>;
    findOne(id: string): Promise<Product>;
    getTrending(): Promise<Product[]>;
    create(createProductDto: CreateProductDto): Promise<Product>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<Product>;
}
