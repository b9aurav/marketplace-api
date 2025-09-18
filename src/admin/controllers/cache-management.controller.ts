import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdminGuard } from "../guards/admin.guard";
import { CacheService } from "../../common/cache/cache.service";
import { CacheMonitoringService } from "../../common/cache/services/cache-monitoring.service";
import { CacheWarmingService } from "../../common/cache/services/cache-warming.service";

@ApiTags("Admin Cache Management")
@Controller("api/admin/cache")
@UseGuards(AdminGuard)
export class CacheManagementController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheMonitoringService: CacheMonitoringService,
    private readonly cacheWarmingService: CacheWarmingService,
  ) {}

  @Get("metrics")
  @ApiOperation({ summary: "Get cache performance metrics" })
  @ApiResponse({
    status: 200,
    description: "Cache metrics retrieved successfully",
  })
  getCacheMetrics() {
    return {
      success: true,
      data: this.cacheMonitoringService.getCacheMetrics(),
    };
  }

  @Get("health")
  @ApiOperation({ summary: "Get cache health status" })
  @ApiResponse({
    status: 200,
    description: "Cache health status retrieved successfully",
  })
  async getCacheHealth() {
    const health = await this.cacheMonitoringService.getCacheHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get("report")
  @ApiOperation({ summary: "Generate cache performance report" })
  @ApiResponse({
    status: 200,
    description: "Cache performance report generated successfully",
  })
  async getCacheReport() {
    const report = await this.cacheMonitoringService.generatePerformanceReport();
    return {
      success: true,
      data: report,
    };
  }

  @Post("warmup")
  @ApiOperation({ summary: "Warm up cache with frequently accessed data" })
  @ApiResponse({
    status: 200,
    description: "Cache warmup completed successfully",
  })
  @HttpCode(HttpStatus.OK)
  async warmupCache() {
    await this.cacheWarmingService.warmupFrequentlyAccessedData();
    return {
      success: true,
      message: "Cache warmup completed successfully",
    };
  }

  @Post("warmup/featured-products")
  @ApiOperation({ summary: "Warm up cache for featured products" })
  @ApiResponse({
    status: 200,
    description: "Featured products cache warmup completed successfully",
  })
  @HttpCode(HttpStatus.OK)
  async warmupFeaturedProducts() {
    await this.cacheWarmingService.warmupFeaturedProducts();
    return {
      success: true,
      message: "Featured products cache warmup completed successfully",
    };
  }

  @Post("warmup/analytics")
  @ApiOperation({ summary: "Warm up cache for analytics data" })
  @ApiResponse({
    status: 200,
    description: "Analytics cache warmup completed successfully",
  })
  @HttpCode(HttpStatus.OK)
  async warmupAnalytics() {
    await this.cacheWarmingService.warmupAnalyticsData();
    return {
      success: true,
      message: "Analytics cache warmup completed successfully",
    };
  }

  @Delete("clear")
  @ApiOperation({ summary: "Clear all cache entries" })
  @ApiResponse({
    status: 200,
    description: "Cache cleared successfully",
  })
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    await this.cacheService.delPattern("*");
    return {
      success: true,
      message: "Cache cleared successfully",
    };
  }

  @Delete("metrics/reset")
  @ApiOperation({ summary: "Reset cache metrics" })
  @ApiResponse({
    status: 200,
    description: "Cache metrics reset successfully",
  })
  @HttpCode(HttpStatus.OK)
  resetMetrics() {
    this.cacheMonitoringService.resetMetrics();
    return {
      success: true,
      message: "Cache metrics reset successfully",
    };
  }

  @Post("configure/lru")
  @ApiOperation({ summary: "Configure LRU eviction policy" })
  @ApiResponse({
    status: 200,
    description: "LRU eviction policy configured successfully",
  })
  @HttpCode(HttpStatus.OK)
  async configureLRU() {
    await this.cacheService.configureLRUEviction();
    return {
      success: true,
      message: "LRU eviction policy configured successfully",
    };
  }

  @Get("memory")
  @ApiOperation({ summary: "Get cache memory usage information" })
  @ApiResponse({
    status: 200,
    description: "Cache memory usage retrieved successfully",
  })
  async getMemoryUsage() {
    const memoryUsage = await this.cacheService.getMemoryUsage();
    return {
      success: true,
      data: memoryUsage,
    };
  }
}