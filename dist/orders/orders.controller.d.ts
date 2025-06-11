import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getUserOrders(req: any, status?: string): Promise<{
        orders: {
            id: string;
            date: Date;
            total: number;
            status: import("./entities/order.entity").OrderStatus;
        }[];
    }>;
    getOrderDetails(req: any, orderId: string): Promise<import("./entities/order.entity").Order>;
    cancelOrder(req: any, orderId: string): Promise<{
        message: string;
    }>;
    trackOrder(req: any, orderId: string): Promise<{
        status: import("./entities/order.entity").OrderStatus;
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
