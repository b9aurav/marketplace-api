import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
export declare class CartService {
    private cartRepository;
    private cartItemRepository;
    private productsService;
    constructor(cartRepository: Repository<Cart>, cartItemRepository: Repository<CartItem>, productsService: ProductsService);
    getCart(userId: string): Promise<{
        items: CartItem[];
        total: number;
    }>;
    addItem(userId: string, addCartItemDto: AddCartItemDto): Promise<CartItem>;
    removeItem(userId: string, itemId: string): Promise<void>;
    applyCoupon(userId: string, code: string): Promise<{
        discounted_total: number;
    }>;
    private getOrCreateCart;
    clearCart(userId: string): Promise<void>;
}
