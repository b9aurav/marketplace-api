import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Role } from '../common/decorators/roles.decorator';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async getDashboardSummary() {
    // Get total sales (sum of all paid orders)
    const totalSales = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .getRawOne();

    // Get active users (users who have placed at least one order)
    const activeUsers = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.orders', 'order')
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne();

    // Get pending orders
    const pendingOrders = await this.ordersRepository.count({
      where: { status: OrderStatus.PENDING },
    });

    // Get total products
    const totalProducts = await this.productsRepository.count();

    return {
      total_sales: totalSales?.total || 0,
      active_users: activeUsers?.count || 0,
      pending_orders: pendingOrders,
      total_products: totalProducts,
    };
  }

  async getSalesAnalytics(range?: string) {
    const endDate = new Date();
    let startDate = new Date();

    // Set date range based on the range parameter
    switch (range) {
      case 'last_30_days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last_90_days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default: // last_7_days
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get daily sales data
    const salesData = await this.ordersRepository
      .createQueryBuilder('order')
      .select('DATE(order.created_at)', 'date')
      .addSelect('SUM(order.total)', 'revenue')
      .where('order.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .groupBy('DATE(order.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Format the data
    const dates = salesData.map(data => data.date);
    const revenue = salesData.map(data => parseFloat(data.revenue));

    return {
      dates,
      revenue,
      range: range || 'last_7_days',
    };
  }

  async getUsers(search?: string) {
    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.orders', 'order')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.created_at',
        'user.role',
        'COUNT(DISTINCT order.id) as order_count',
      ])
      .groupBy('user.id');

    if (search) {
      query.where('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [users, total] = await query.getManyAndCount();

    return {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        role: user.role,
        order_count: user['order_count'],
      })),
      total,
    };
  }

  async blockUser(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user role to USER (effectively blocking admin access)
    user.role = Role.USER;
    await this.usersRepository.save(user);

    return {
      message: 'User blocked successfully',
      user_id: userId,
    };
  }
}