import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';
import { Address } from '../../users/entities/address.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: string;
    status: OrderStatus;
    total: number;
    tracking_number: string;
    payment_method: string;
    transaction_id: string;
    user: User;
    user_id: string;
    address: Address;
    address_id: string;
    items: OrderItem[];
    created_at: Date;
    updated_at: Date;
    coupon_code: string;
    discount_amount: number;
    tracking_info: {
        location: string;
        estimated_delivery: Date;
        updates: {
            timestamp: Date;
            status: string;
            location: string;
        }[];
    };
}
