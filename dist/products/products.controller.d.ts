import { ProductsService } from './products.service';
import { FindProductsDto } from './dto/find-products.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(findProductsDto: FindProductsDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<import("./entities/product.entity").Product>>;
    getTrending(): Promise<import("./entities/product.entity").Product[]>;
    findOne(id: string): Promise<import("./entities/product.entity").Product>;
}
