import { ProductsService } from '../products/products.service';
export declare class RecommendationsService {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getPersonalizedRecommendations(userId: string): Promise<{
        products: import("../products/entities/product.entity").Product[];
        reason: string;
    }>;
    getWishlist(userId: string): Promise<{
        products: any[];
        total: number;
    }>;
}
