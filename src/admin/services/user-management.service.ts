import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeyGenerator } from '../../common/cache/cache-key-generator.service';
import { CACHE_KEYS, CACHE_TTL, CACHE_PATTERNS } from '../../common/cache/constants/cache.constants';
import { AdminAuditService } from './admin-audit.service';
import {
  GetUsersQueryDto,
  UpdateUserStatusDto,
  UserListItemDto,
  PaginatedUsersDto,
  UserDetailsDto,
  UserAnalyticsDto,
  GetUserAnalyticsQueryDto,
  UserStatus,
} from '../dto/user-management.dto';
import { Role } from '../../common/decorators/roles.decorator';

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private cacheService: CacheService,
    private cacheKeyGenerator: CacheKeyGenerator,
    private auditService: AdminAuditService,
  ) {}

  async getUsers(query: GetUsersQueryDto): Promise<PaginatedUsersDto> {
    const cacheKey = this.cacheKeyGenerator.generateListKey(
      CACHE_KEYS.USER_LIST,
      query.page,
      query.limit,
      {
        search: query.search,
        role: query.role,
        status: query.status,
        date_from: query.date_from,
        date_to: query.date_to,
        sort_by: query.sort_by,
        sort_order: query.sort_order,
      }
    );

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<PaginatedUsersDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Users list served from cache: ${cacheKey}`);
      return cachedResult;
    }

    // Build query
    const queryBuilder = this.buildUsersQuery(query);
    
    // Get total count
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    queryBuilder.skip(offset).take(query.limit);

    // Execute query
    const users = await queryBuilder.getMany();

    // Transform to DTOs with additional data
    const userDtos = await Promise.all(
      users.map(user => this.transformToUserListItem(user))
    );

    const result: PaginatedUsersDto = {
      data: userDtos,
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.ceil(total / query.limit),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.USER_LIST);
    this.logger.debug(`Users list cached: ${cacheKey}`);

    return result;
  }

  async getUserDetails(id: string): Promise<UserDetailsDto> {
    const cacheKey = this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.USER_DETAILS, id);

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<UserDetailsDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`User details served from cache: ${cacheKey}`);
      return cachedResult;
    }

    // Find user with relations
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses', 'orders'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Get additional analytics data
    const orderStats = await this.getUserOrderStats(id);
    const recentOrders = await this.getUserRecentOrders(id, 5);

    const userDetails: UserDetailsDto = {
      ...await this.transformToUserListItem(user),
      metadata: user.metadata,
      addresses: user.addresses || [],
      recent_orders: recentOrders,
      total_orders: orderStats.total_orders,
      average_order_value: orderStats.average_order_value,
      first_order_date: orderStats.first_order_date,
      last_order_date: orderStats.last_order_date,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, userDetails, CACHE_TTL.USER_DETAILS);
    this.logger.debug(`User details cached: ${cacheKey}`);

    return userDetails;
  }

  async updateUserStatus(id: string, updateDto: UpdateUserStatusDto, adminId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const oldStatus = user.is_active;
    const newStatus = updateDto.status === UserStatus.ACTIVE;

    // Update user status
    await this.userRepository.update(id, {
      is_active: newStatus,
      updated_at: new Date(),
    });

    // Log the action
    await this.auditService.logAction({
      adminId: adminId,
      action: 'UPDATE_USER_STATUS',
      resource: 'user',
      resourceId: id,
      description: `Updated user status from ${oldStatus ? 'active' : 'inactive'} to ${updateDto.status}`,
      metadata: {
        old_status: oldStatus ? 'active' : 'inactive',
        new_status: updateDto.status,
        reason: updateDto.reason,
      },
      ipAddress: '0.0.0.0', // This should be passed from the request context
    });

    // Invalidate related cache entries
    await this.invalidateUserCaches(id);

    this.logger.log(`User ${id} status updated from ${oldStatus} to ${updateDto.status} by admin ${adminId}`);
  }

  async getUserAnalytics(query: GetUserAnalyticsQueryDto): Promise<UserAnalyticsDto> {
    const cacheKey = this.cacheKeyGenerator.generateAnalyticsKey(
      CACHE_KEYS.USER_ANALYTICS,
      query.date_from ? new Date(query.date_from) : undefined,
      query.date_to ? new Date(query.date_to) : undefined,
      query.interval
    );

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<UserAnalyticsDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`User analytics served from cache: ${cacheKey}`);
      return cachedResult;
    }

    const dateFrom = query.date_from ? new Date(query.date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const dateTo = query.date_to ? new Date(query.date_to) : new Date();

    // Get basic user counts
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { is_active: true } }),
      this.userRepository.count({ where: { is_active: false } }),
    ]);

    // Get new users counts
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newUsersToday, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
      this.userRepository.count({ where: { created_at: { $gte: todayStart } as any } }),
      this.userRepository.count({ where: { created_at: { $gte: weekStart } as any } }),
      this.userRepository.count({ where: { created_at: { $gte: monthStart } as any } }),
    ]);

    // Get registration trend
    const registrationTrend = await this.getRegistrationTrend(dateFrom, dateTo, query.interval);

    // Get role distribution
    const roleDistribution = await this.getRoleDistribution();

    // Get activity metrics (simplified for now)
    const activityMetrics = await this.getActivityMetrics(dateFrom, dateTo, query.interval);

    const analytics: UserAnalyticsDto = {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      blocked_users: 0, // We don't have blocked status in current schema
      new_users_today: newUsersToday,
      new_users_this_week: newUsersThisWeek,
      new_users_this_month: newUsersThisMonth,
      registration_trend: registrationTrend,
      role_distribution: roleDistribution,
      activity_metrics: activityMetrics,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, analytics, CACHE_TTL.USER_LIST);
    this.logger.debug(`User analytics cached: ${cacheKey}`);

    return analytics;
  }

  private buildUsersQuery(query: GetUsersQueryDto): SelectQueryBuilder<User> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Add search filter
    if (query.search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Add role filter
    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    // Add status filter
    if (query.status) {
      const isActive = query.status === UserStatus.ACTIVE;
      queryBuilder.andWhere('user.is_active = :isActive', { isActive });
    }

    // Add date range filter
    if (query.date_from) {
      queryBuilder.andWhere('user.created_at >= :dateFrom', { dateFrom: query.date_from });
    }
    if (query.date_to) {
      queryBuilder.andWhere('user.created_at <= :dateTo', { dateTo: query.date_to });
    }

    // Add sorting
    const sortField = query.sort_by === 'name' ? 'user.name' : 
                     query.sort_by === 'email' ? 'user.email' : 'user.created_at';
    const sortOrder = query.sort_order?.toUpperCase() as 'ASC' | 'DESC' || 'DESC';
    queryBuilder.orderBy(sortField, sortOrder);

    return queryBuilder;
  }

  private async transformToUserListItem(user: User): Promise<UserListItemDto> {
    // Get order statistics for this user
    const orderStats = await this.getUserOrderStats(user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      order_count: orderStats.total_orders,
      total_spent: orderStats.total_spent,
    };
  }

  private async getUserOrderStats(userId: string) {
    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(*) as total_orders',
        'COALESCE(SUM(order.total), 0) as total_spent',
        'AVG(order.total) as average_order_value',
        'MIN(order.created_at) as first_order_date',
        'MAX(order.created_at) as last_order_date',
      ])
      .where('order.user_id = :userId', { userId })
      .andWhere('order.status IN (:...statuses)', { statuses: ['delivered', 'completed'] })
      .getRawOne();

    return {
      total_orders: parseInt(stats.total_orders) || 0,
      total_spent: parseFloat(stats.total_spent) || 0,
      average_order_value: parseFloat(stats.average_order_value) || 0,
      first_order_date: stats.first_order_date,
      last_order_date: stats.last_order_date,
    };
  }

  private async getUserRecentOrders(userId: string, limit: number = 5) {
    return this.orderRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      select: ['id', 'total', 'status', 'created_at'],
    });
  }

  private async getRegistrationTrend(dateFrom: Date, dateTo: Date, interval: string) {
    const dateFormat = interval === 'month' ? '%Y-%m' : 
                      interval === 'week' ? '%Y-%u' : '%Y-%m-%d';

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `TO_CHAR(user.created_at, '${dateFormat}') as date`,
        'COUNT(*) as count',
      ])
      .where('user.created_at >= :dateFrom', { dateFrom })
      .andWhere('user.created_at <= :dateTo', { dateTo })
      .groupBy(`TO_CHAR(user.created_at, '${dateFormat}')`)
      .orderBy(`TO_CHAR(user.created_at, '${dateFormat}')`)
      .getRawMany();

    return result.map(item => ({
      date: item.date,
      count: parseInt(item.count),
    }));
  }

  private async getRoleDistribution() {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.role as role', 'COUNT(*) as count'])
      .groupBy('user.role')
      .getRawMany();

    const total = result.reduce((sum, item) => sum + parseInt(item.count), 0);

    return result.map(item => ({
      role: item.role,
      count: parseInt(item.count),
      percentage: total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0,
    }));
  }

  private async getActivityMetrics(dateFrom: Date, dateTo: Date, interval: string) {
    // This is a simplified implementation
    // In a real application, you would track user activity/login events
    const dateFormat = interval === 'month' ? '%Y-%m' : 
                      interval === 'week' ? '%Y-%u' : '%Y-%m-%d';

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `TO_CHAR(user.last_login_at, '${dateFormat}') as period`,
        'COUNT(DISTINCT user.id) as active_users',
        'COUNT(*) as login_count',
      ])
      .where('user.last_login_at >= :dateFrom', { dateFrom })
      .andWhere('user.last_login_at <= :dateTo', { dateTo })
      .andWhere('user.last_login_at IS NOT NULL')
      .groupBy(`TO_CHAR(user.last_login_at, '${dateFormat}')`)
      .orderBy(`TO_CHAR(user.last_login_at, '${dateFormat}')`)
      .getRawMany();

    return result.map(item => ({
      period: item.period || 'N/A',
      active_users: parseInt(item.active_users) || 0,
      login_count: parseInt(item.login_count) || 0,
    }));
  }

  private async invalidateUserCaches(userId?: string): Promise<void> {
    try {
      // Invalidate all user-related caches
      await this.cacheService.delPattern(CACHE_PATTERNS.USERS);
      
      if (userId) {
        // Invalidate specific user cache
        const userDetailsCacheKey = this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.USER_DETAILS, userId);
        await this.cacheService.del(userDetailsCacheKey);
      }

      this.logger.debug('User caches invalidated');
    } catch (error) {
      this.logger.error('Failed to invalidate user caches:', error);
    }
  }
}