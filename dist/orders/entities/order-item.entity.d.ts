import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
export declare class OrderItem {
    id: string;
    quantity: number;
    price: number;
    order: Order;
    order_id: string;
    product: Product;
    product_id: string;
    product_name: string;
}
