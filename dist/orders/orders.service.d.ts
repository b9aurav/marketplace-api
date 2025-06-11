import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
export declare class OrdersService {
    private ordersRepository;
    private orderItemsRepository;
    constructor(ordersRepository: Repository<Order>, orderItemsRepository: Repository<OrderItem>);
    getUserOrders(userId: string, status?: string): Promise<{
        orders: {
            id: string;
            date: Date;
            total: number;
            status: OrderStatus;
        }[];
    }>;
    getOrderDetails(userId: string, orderId: string): Promise<Order>;
    cancelOrder(userId: string, orderId: string): Promise<{
        message: string;
    }>;
    trackOrder(userId: string, orderId: string): Promise<{
        status: OrderStatus;
        tracking_number: string;
        tracking_info: {
            location: string;
            estimated_delivery: Date;
            updates: {
                timestamp: Date;
                status: string;
                location: string;
            }[];
        };
    }>;
}
