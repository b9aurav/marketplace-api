import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getCart(userId: string): Promise<{ items: CartItem[]; total: number }> {
    const cart = await this.getOrCreateCart(userId);
    
    // Load cart with items and product details
    const cartWithItems = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product'],
    });
    
    // Calculate cart total
    const subtotal = cartWithItems.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    
    const total = subtotal - (cartWithItems.discount_amount || 0);
    
    return {
      items: cartWithItems.items,
      total: Math.max(0, total), // Ensure total is not negative
    };
  }

  async addItem(userId: string, addCartItemDto: AddCartItemDto): Promise<CartItem> {
    const { product_id, quantity } = addCartItemDto;
    
    // Check if product exists and has enough stock
    const product = await this.productsService.findOne(product_id);
    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock available');
    }
    
    const cart = await this.getOrCreateCart(userId);
    
    // Check if item already exists in cart
    let cartItem = await this.cartItemRepository.findOne({
      where: { cart_id: cart.id, product_id },
    });
    
    if (cartItem) {
      // Update existing item
      cartItem.quantity += quantity;
      cartItem.price = product.price; // Update price in case it changed
    } else {
      // Create new cart item
      cartItem = this.cartItemRepository.create({
        cart_id: cart.id,
        product_id,
        quantity,
        price: product.price,
      });
    }
    
    return this.cartItemRepository.save(cartItem);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart_id: cart.id },
    });
    
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }
    
    await this.cartItemRepository.remove(cartItem);
  }

  async applyCoupon(userId: string, code: string): Promise<{ discounted_total: number }> {
    const cart = await this.getOrCreateCart(userId);
    
    // In a real application, you would validate the coupon code against a database
    // For this example, we'll use a fixed discount for any coupon
    
    // Simple validation - in a real app this would check a coupons table
    if (code.length < 3) {
      throw new BadRequestException('Invalid coupon code');
    }
    
    // Get current cart total
    const { total: currentTotal } = await this.getCart(userId);
    
    // Apply 10% discount (in a real app, this would be based on coupon rules)
    const discountAmount = currentTotal * 0.1;
    
    // Update cart with coupon info
    cart.coupon_code = code;
    cart.discount_amount = discountAmount;
    await this.cartRepository.save(cart);
    
    return {
      discounted_total: currentTotal - discountAmount,
    };
  }

  private async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user_id: userId },
    });
    
    if (!cart) {
      cart = this.cartRepository.create({ user_id: userId });
      cart = await this.cartRepository.save(cart);
    }
    
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    
    // Remove all items
    await this.cartItemRepository.delete({ cart_id: cart.id });
    
    // Reset coupon and discount
    cart.coupon_code = null;
    cart.discount_amount = 0;
    await this.cartRepository.save(cart);
  }
}