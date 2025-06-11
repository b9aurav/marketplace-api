"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const category_entity_1 = require("./entities/category.entity");
const review_entity_1 = require("./entities/review.entity");
let ProductsService = class ProductsService {
    constructor(productsRepository, categoriesRepository, reviewsRepository) {
        this.productsRepository = productsRepository;
        this.categoriesRepository = categoriesRepository;
        this.reviewsRepository = reviewsRepository;
    }
    async findAll(findProductsDto) {
        const { category, min_price, max_price, sort, page = 1, limit = 20 } = findProductsDto;
        const queryBuilder = this.productsRepository.createQueryBuilder('product');
        if (category) {
            queryBuilder.andWhere('product.category_id = :category', { category });
        }
        if (min_price) {
            queryBuilder.andWhere('product.price >= :min_price', { min_price });
        }
        if (max_price) {
            queryBuilder.andWhere('product.price <= :max_price', { max_price });
        }
        if (sort) {
            switch (sort) {
                case 'price_asc':
                    queryBuilder.orderBy('product.price', 'ASC');
                    break;
                case 'price_desc':
                    queryBuilder.orderBy('product.price', 'DESC');
                    break;
                case 'newest':
                    queryBuilder.orderBy('product.created_at', 'DESC');
                    break;
                case 'rating':
                    queryBuilder.orderBy('product.rating', 'DESC');
                    break;
                default:
                    queryBuilder.orderBy('product.created_at', 'DESC');
            }
        }
        else {
            queryBuilder.orderBy('product.created_at', 'DESC');
        }
        const total = await queryBuilder.getCount();
        queryBuilder
            .take(limit)
            .skip((page - 1) * limit);
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
    async findOne(id) {
        const product = await this.productsRepository.findOne({
            where: { id },
            relations: ['reviews', 'reviews.user'],
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async getTrending() {
        return this.productsRepository.find({
            order: { rating: 'DESC' },
            take: 10,
        });
    }
    async create(createProductDto) {
        const product = this.productsRepository.create(createProductDto);
        return this.productsRepository.save(product);
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        Object.assign(product, updateProductDto);
        return this.productsRepository.save(product);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map