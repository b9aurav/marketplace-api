import { RecommendationsService } from './recommendations.service';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    getRecommendations(req: any): Promise<{
        products: import("../products/entities/product.entity").Product[];
        reason: string;
    }>;
    getWishlist(req: any): Promise<{
        products: any[];
        total: number;
    }>;
}
