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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
let OrdersService = class OrdersService {
    constructor(ordersRepository, orderItemsRepository) {
        this.ordersRepository = ordersRepository;
        this.orderItemsRepository = orderItemsRepository;
    }
    async getUserOrders(userId, status) {
        const queryBuilder = this.ordersRepository.createQueryBuilder('order')
            .where('order.user_id = :userId', { userId });
        if (status) {
            queryBuilder.andWhere('order.status = :status', { status });
        }
        const orders = await queryBuilder
            .orderBy('order.created_at', 'DESC')
            .getMany();
        return {
            orders: orders.map(order => ({
                id: order.id,
                date: order.created_at,
                total: order.total,
                status: order.status,
            })),
        };
    }
    async getOrderDetails(userId, orderId) {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, user_id: userId },
            relations: ['items', 'items.product', 'address'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async cancelOrder(userId, orderId) {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, user_id: userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== order_entity_1.OrderStatus.PENDING && order.status !== order_entity_1.OrderStatus.PAID) {
            throw new Error('Order cannot be cancelled');
        }
        order.status = order_entity_1.OrderStatus.CANCELLED;
        await this.ordersRepository.save(order);
        return { message: 'Order cancelled successfully' };
    }
    async trackOrder(userId, orderId) {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, user_id: userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return {
            status: order.status,
            tracking_number: order.tracking_number,
            tracking_info: order.tracking_info || {
                location: 'Processing Center',
                estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                updates: [
                    {
                        timestamp: order.created_at,
                        status: 'Order placed',
                        location: 'Online',
                    },
                ],
            },
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map