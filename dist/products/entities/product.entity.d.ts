import { Category } from './category.entity';
import { Review } from './review.entity';
export declare class Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    rating: number;
    category: Category;
    category_id: string;
    reviews: Review[];
    created_at: Date;
    updated_at: Date;
}
