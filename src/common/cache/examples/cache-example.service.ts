import { Injectable } from "@nestjs/common";
import { Cache, CacheInvalidate } from "../decorators/cache.decorator";
import {
  CACHE_TTL,
  CACHE_KEYS,
  CACHE_PATTERNS,
} from "../constants/cache.constants";

@Injectable()
export class CacheExampleService {
  /**
   * Example of method-level caching with default key generation
   */
  @Cache({ ttl: CACHE_TTL.USER_LIST })
  async getUserList(page: number = 1, limit: number = 10, search?: string) {
    // Simulate database query
    console.log(
      `Fetching users from database: page=${page}, limit=${limit}, search=${search}`,
    );

    return {
      users: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
      ],
      total: 2,
      page,
      limit,
    };
  }

  /**
   * Example of method-level caching with custom key generation
   */
  @Cache({
    ttl: CACHE_TTL.USER_DETAILS,
    keyGenerator: (args) => `${CACHE_KEYS.USER_DETAILS}:${args[0]}`,
  })
  async getUserDetails(userId: string) {
    // Simulate database query
    console.log(`Fetching user details from database: userId=${userId}`);

    return {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date(),
    };
  }

  /**
   * Example of method-level caching with condition
   */
  @Cache({
    ttl: CACHE_TTL.PRODUCT_LIST,
    condition: (args) => {
      // Only cache if not searching (search results change frequently)
      const [, , search] = args;
      return !search;
    },
  })
  async getProductList(page: number = 1, limit: number = 10, search?: string) {
    // Simulate database query
    console.log(
      `Fetching products from database: page=${page}, limit=${limit}, search=${search}`,
    );

    return {
      products: [
        { id: 1, name: "Product 1", price: 100 },
        { id: 2, name: "Product 2", price: 200 },
      ],
      total: 2,
      page,
      limit,
    };
  }

  /**
   * Example of cache invalidation when updating data
   */
  @CacheInvalidate([CACHE_PATTERNS.USERS])
  async updateUser(userId: string, data: any) {
    // Simulate database update
    console.log(`Updating user in database: userId=${userId}`, data);

    return {
      id: userId,
      ...data,
      updatedAt: new Date(),
    };
  }

  /**
   * Example of multiple cache invalidation patterns
   */
  @CacheInvalidate([CACHE_PATTERNS.PRODUCTS, CACHE_PATTERNS.CATEGORIES])
  async updateProduct(productId: string, data: any) {
    // Simulate database update
    console.log(`Updating product in database: productId=${productId}`, data);

    return {
      id: productId,
      ...data,
      updatedAt: new Date(),
    };
  }

  /**
   * Example of analytics caching with date-based key generation
   */
  @Cache({
    ttl: CACHE_TTL.SALES_ANALYTICS,
    keyGenerator: (args) => {
      const [dateFrom, dateTo, interval] = args;
      const keyParts: string[] = [CACHE_KEYS.SALES_ANALYTICS];
      if (dateFrom)
        keyParts.push(`from=${dateFrom.toISOString().split("T")[0]}`);
      if (dateTo) keyParts.push(`to=${dateTo.toISOString().split("T")[0]}`);
      if (interval) keyParts.push(`interval=${interval}`);
      return keyParts.join(":");
    },
  })
  async getSalesAnalytics(dateFrom?: Date, dateTo?: Date, interval?: string) {
    // Simulate complex analytics query
    console.log(
      `Calculating sales analytics: dateFrom=${dateFrom}, dateTo=${dateTo}, interval=${interval}`,
    );

    return {
      totalSales: 10000,
      totalOrders: 100,
      averageOrderValue: 100,
      growthRate: 15.5,
      dateRange: { from: dateFrom, to: dateTo },
      interval,
    };
  }
}
