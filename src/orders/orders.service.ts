import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
  ) {}

  async getUserOrders(userId: string, status?: string) {
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

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user_id: userId },
      relations: ['items', 'items.product', 'address'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user_id: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
      throw new Error('Order cannot be cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    await this.ordersRepository.save(order);

    return { message: 'Order cancelled successfully' };
  }

  async trackOrder(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user_id: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
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
}