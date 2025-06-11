"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("./entities/cart.entity");
const cart_item_entity_1 = require("./entities/cart-item.entity");
const products_service_1 = require("../products/products.service");
let CartService = class CartService {
    constructor(cartRepository, cartItemRepository, productsService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productsService = productsService;
    }
    async getCart(userId) {
        const cart = await this.getOrCreateCart(userId);
        const cartWithItems = await this.cartRepository.findOne({
            where: { id: cart.id },
            relations: ['items', 'items.product'],
        });
        const subtotal = cartWithItems.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const total = subtotal - (cartWithItems.discount_amount || 0);
        return {
            items: cartWithItems.items,
            total: Math.max(0, total),
        };
    }
    async addItem(userId, addCartItemDto) {
        const { product_id, quantity } = addCartItemDto;
        const product = await this.productsService.findOne(product_id);
        if (product.stock < quantity) {
            throw new common_1.BadRequestException('Not enough stock available');
        }
        const cart = await this.getOrCreateCart(userId);
        let cartItem = await this.cartItemRepository.findOne({
            where: { cart_id: cart.id, product_id },
        });
        if (cartItem) {
            cartItem.quantity += quantity;
            cartItem.price = product.price;
        }
        else {
            cartItem = this.cartItemRepository.create({
                cart_id: cart.id,
                product_id,
                quantity,
                price: product.price,
            });
        }
        return this.cartItemRepository.save(cartItem);
    }
    async removeItem(userId, itemId) {
        const cart = await this.getOrCreateCart(userId);
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: itemId, cart_id: cart.id },
        });
        if (!cartItem) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        await this.cartItemRepository.remove(cartItem);
    }
    async applyCoupon(userId, code) {
        const cart = await this.getOrCreateCart(userId);
        if (code.length < 3) {
            throw new common_1.BadRequestException('Invalid coupon code');
        }
        const { total: currentTotal } = await this.getCart(userId);
        const discountAmount = currentTotal * 0.1;
        cart.coupon_code = code;
        cart.discount_amount = discountAmount;
        await this.cartRepository.save(cart);
        return {
            discounted_total: currentTotal - discountAmount,
        };
    }
    async getOrCreateCart(userId) {
        let cart = await this.cartRepository.findOne({
            where: { user_id: userId },
        });
        if (!cart) {
            cart = this.cartRepository.create({ user_id: userId });
            cart = await this.cartRepository.save(cart);
        }
        return cart;
    }
    async clearCart(userId) {
        const cart = await this.getOrCreateCart(userId);
        await this.cartItemRepository.delete({ cart_id: cart.id });
        cart.coupon_code = null;
        cart.discount_amount = 0;
        await this.cartRepository.save(cart);
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        products_service_1.ProductsService])
], CartService);
//# sourceMappingURL=cart.service.js.map