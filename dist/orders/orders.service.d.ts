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
    getAllOrders(userId?: string, status?: string): Promise<{
        orders: {
            id: string;
            date: Date;
            total: number;
            status: OrderStatus;
            user: {
                id: string;
                email: string;
                name: string;
            };
            items: {
                id: string;
                quantity: number;
                price: number;
                product: {
                    id: string;
                    name: string;
                    images: string[];
                };
            }[];
            address: import("../users/entities/address.entity").Address;
            tracking_number: string;
            payment_method: string;
            transaction_id: string;
        }[];
    }>;
    updateOrderStatus(orderId: string, updateOrderStatusDto: {
        status: OrderStatus;
    }): Promise<{
        message: string;
        order: {
            id: string;
            status: OrderStatus;
        };
    }>;
}
