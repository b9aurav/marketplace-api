import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';
export declare class CartItem {
    id: string;
    quantity: number;
    price: number;
    cart: Cart;
    cart_id: string;
    product: Product;
    product_id: string;
}
