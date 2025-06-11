import { CartItem } from './cart-item.entity';
export declare class Cart {
    id: string;
    user_id: string;
    items: CartItem[];
    coupon_code: string;
    discount_amount: number;
}
