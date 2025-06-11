import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class AdminOrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getAllOrders(userId?: string, status?: string): Promise<any>;
    updateOrderStatus(orderId: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<any>;
}
