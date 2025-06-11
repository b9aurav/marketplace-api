import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';
export declare class Review {
    id: string;
    content: string;
    rating: number;
    product: Product;
    product_id: string;
    user: User;
    user_id: string;
    created_at: Date;
}
