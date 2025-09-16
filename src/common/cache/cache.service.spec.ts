import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: jest.Mocked<any>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      stores: [
        {
          client: {
            keys: jest.fn(),
            ttl: jest.fn(),
          },
        },
      ],
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
    it('should return cached value when exists', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return null when cache miss', async () => {
      const key = 'test:key';
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(key);

      expect(result).toBeNull();
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return null on error', async () => {
      const key = 'test:key';
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      const ttl = 300;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should throw error when set fails', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      mockCacheManager.set.mockRejectedValue(new Error('Set error'));

      await expect(service.set(key, value)).rejects.toThrow('Set error');
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      const key = 'test:key';

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      const key = 'test:key';
      mockCacheManager.get.mockResolvedValue({ data: 'test' });

      const result = await service.exists(key);

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const key = 'test:key';
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.exists(key);

      expect(result).toBe(false);
    });
  });

  describe('delPattern', () => {
    it('should delete keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2'];
      mockCacheManager.stores[0].client.keys.mockResolvedValue(keys);

      await service.delPattern(pattern);

      expect(mockCacheManager.stores[0].client.keys).toHaveBeenCalledWith(pattern);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('ttl', () => {
    it('should return TTL for key', async () => {
      const key = 'test:key';
      const ttl = 300;
      mockCacheManager.stores[0].client.ttl.mockResolvedValue(ttl);

      const result = await service.ttl(key);

      expect(result).toBe(ttl);
      expect(mockCacheManager.stores[0].client.ttl).toHaveBeenCalledWith(key);
    });
  });
});