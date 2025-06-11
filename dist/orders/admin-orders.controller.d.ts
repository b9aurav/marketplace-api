import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class AdminOrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getAllOrders(userId?: string, status?: string): Promise<{
        orders: {
            id: string;
            date: Date;
            total: number;
            status: import("./entities/order.entity").OrderStatus;
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
    updateOrderStatus(orderId: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<{
        message: string;
        order: {
            id: string;
            status: import("./entities/order.entity").OrderStatus;
        };
    }>;
}
