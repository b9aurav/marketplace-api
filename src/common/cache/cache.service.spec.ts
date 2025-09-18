import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CacheMetrics } from './interfaces/cache.interface';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      stores: [{
        client: {
          keys: jest.fn(),
          ttl: jest.fn(),
          memory: jest.fn(),
          config: jest.fn(),
        }
      }]
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value and update metrics', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      
      const metrics = service.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should handle cache miss and update metrics', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
      
      const metrics = service.getMetrics();
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get(key);

      expect(result).toBeNull();
      
      const metrics = service.getMetrics();
      expect(metrics.errors).toBe(1);
    });
  });

  describe('set', () => {
    it('should set cache value and update metrics', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 300;
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
      
      const metrics = service.getMetrics();
      expect(metrics.sets).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      await service.set(key, value);

      const metrics = service.getMetrics();
      expect(metrics.errors).toBe(1);
    });
  });

  describe('del', () => {
    it('should delete cache value and update metrics', async () => {
      const key = 'test-key';
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
      
      const metrics = service.getMetrics();
      expect(metrics.deletes).toBe(1);
    });
  });

  describe('delPattern', () => {
    it('should delete cache values by pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2'];
      mockCacheManager.stores[0].client.keys.mockResolvedValue(keys);
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.delPattern(pattern);

      expect(mockCacheManager.stores[0].client.keys).toHaveBeenCalledWith(pattern);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(keys.length);
    });
  });

  describe('getMetrics', () => {
    it('should return cache metrics with hit rate', async () => {
      // Simulate some cache operations
      mockCacheManager.get.mockResolvedValueOnce({ data: 'test' }); // hit
      mockCacheManager.get.mockResolvedValueOnce(null); // miss
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.get('key1');
      await service.get('key2');
      await service.set('key3', 'value');

      const metrics = service.getMetrics();

      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.sets).toBe(1);
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.hitRate).toBe(50);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with provided data', async () => {
      const warmupData = [
        { key: 'key1', value: 'value1', ttl: 300 },
        { key: 'key2', value: 'value2' },
      ];
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.warmCache(warmupData);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.set).toHaveBeenCalledWith('key1', 'value1', 300);
      expect(mockCacheManager.set).toHaveBeenCalledWith('key2', 'value2', undefined);
    });
  });

  describe('isAvailable', () => {
    it('should return true when cache is available', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when cache is not available', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('configureLRUEviction', () => {
    it('should configure LRU eviction policy', async () => {
      mockCacheManager.stores[0].client.config.mockResolvedValue(undefined);

      await service.configureLRUEviction();

      expect(mockCacheManager.stores[0].client.config).toHaveBeenCalledWith(
        'SET',
        'maxmemory-policy',
        'allkeys-lru'
      );
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics', async () => {
      // Generate some metrics first
      mockCacheManager.get.mockResolvedValue({ data: 'test' });
      await service.get('test-key');

      let metrics = service.getMetrics();
      expect(metrics.hits).toBe(1);

      service.resetMetrics();

      metrics = service.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.sets).toBe(0);
      expect(metrics.deletes).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });
});