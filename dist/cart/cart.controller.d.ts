import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<{
        items: import("./entities/cart-item.entity").CartItem[];
        total: number;
    }>;
    addItem(req: any, addCartItemDto: AddCartItemDto): Promise<import("./entities/cart-item.entity").CartItem>;
    removeItem(req: any, itemId: string): Promise<any>;
    applyCoupon(req: any, applyCouponDto: ApplyCouponDto): Promise<{
        discounted_total: number;
    }>;
}
