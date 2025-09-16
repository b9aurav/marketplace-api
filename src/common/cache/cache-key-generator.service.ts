import { Injectable } from "@nestjs/common";
import { ICacheKeyGenerator } from "./interfaces/cache.interface";

@Injectable()
export class CacheKeyGenerator implements ICacheKeyGenerator {
  private readonly separator = ":";

  generateKey(prefix: string, params: Record<string, any>): string {
    const keyParts = [prefix];

    // Sort params by key to ensure consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        },
        {} as Record<string, any>,
      );

    // Add each parameter to the key
    for (const [key, value] of Object.entries(sortedParams)) {
      if (value !== undefined && value !== null) {
        // Handle different value types
        let stringValue: string;
        if (Array.isArray(value)) {
          stringValue = value.join(",");
        } else if (typeof value === "object") {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = String(value);
        }
        keyParts.push(`${key}=${stringValue}`);
      }
    }

    return keyParts.join(this.separator);
  }

  generatePatternKey(prefix: string, pattern: string): string {
    return `${prefix}${this.separator}${pattern}`;
  }

  /**
   * Generate a simple key with just prefix and identifier
   */
  generateSimpleKey(prefix: string, id: string | number): string {
    return `${prefix}${this.separator}${id}`;
  }

  /**
   * Generate a key for list operations with pagination
   */
  generateListKey(
    prefix: string,
    page: number = 1,
    limit: number = 10,
    filters: Record<string, any> = {},
  ): string {
    const params = {
      page,
      limit,
      ...filters,
    };
    return this.generateKey(prefix, params);
  }

  /**
   * Generate a key for analytics with date range
   */
  generateAnalyticsKey(
    prefix: string,
    dateFrom?: Date,
    dateTo?: Date,
    interval?: string,
  ): string {
    const params: Record<string, any> = {};

    if (dateFrom) {
      params.from = dateFrom.toISOString().split("T")[0]; // YYYY-MM-DD format
    }
    if (dateTo) {
      params.to = dateTo.toISOString().split("T")[0];
    }
    if (interval) {
      params.interval = interval;
    }

    return this.generateKey(prefix, params);
  }
}
