import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { CacheInterceptor } from './cache.interceptor';
import { CacheService } from '../cache.service';
import { CacheKeyGenerator } from '../cache-key-generator.service';

describe('CacheInterceptor', () => {
    let interceptor: CacheInterceptor;
    let cacheService: jest.Mocked<CacheService>;
    let cacheKeyGenerator: jest.Mocked<CacheKeyGenerator>;
    let reflector: jest.Mocked<Reflector>;

    beforeEach(async () => {
        const mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            isAvailable: jest.fn(),
        };

        const mockCacheKeyGenerator = {
            generateKey: jest.fn(),
        };

        const mockReflector = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheInterceptor,
                { provide: CacheService, useValue: mockCacheService },
                { provide: CacheKeyGenerator, useValue: mockCacheKeyGenerator },
                { provide: Reflector, useValue: mockReflector },
            ],
        }).compile();

        interceptor = module.get<CacheInterceptor>(CacheInterceptor);
        cacheService = module.get(CacheService);
        cacheKeyGenerator = module.get(CacheKeyGenerator);
        reflector = module.get(Reflector);
    });

    const createMockExecutionContext = (): ExecutionContext => {
        const mockRequest = {
            query: { page: 1, limit: 10 },
            params: { id: 'test-id' },
        };

        return {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: () => ({ name: 'testMethod' }),
            getClass: () => ({ name: 'TestService' }),
            getArgs: () => [mockRequest, {}, { page: 1, limit: 10 }],
        } as any;
    };

    const createMockCallHandler = (result: any): CallHandler => ({
        handle: () => of(result),
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should pass through when no cache options are defined', async () => {
        const context = createMockExecutionContext();
        const next = createMockCallHandler('test result');

        reflector.get.mockReturnValue(undefined);

        const observable = await interceptor.intercept(context, next);
        const result = await firstValueFrom(observable);

        expect(result).toBe('test result');
        expect(cacheService.get).not.toHaveBeenCalled();
    });

    it('should return cached result when cache hit occurs', async () => {
        const context = createMockExecutionContext();
        const next = createMockCallHandler('fresh result');
        const cachedResult = 'cached result';

        reflector.get.mockReturnValue({ ttl: 300 });
        cacheService.isAvailable.mockResolvedValue(true);
        cacheKeyGenerator.generateKey.mockReturnValue('test:cache:key');
        cacheService.get.mockResolvedValue(cachedResult);

        const observable = await interceptor.intercept(context, next);
        const result = await firstValueFrom(observable);

        expect(result).toBe(cachedResult);
        expect(cacheService.get).toHaveBeenCalledWith('test:cache:key');
        expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should cache result when cache miss occurs', async () => {
        const context = createMockExecutionContext();
        const freshResult = 'fresh result';
        const next = createMockCallHandler(freshResult);

        reflector.get.mockReturnValue({ ttl: 300 });
        cacheService.isAvailable.mockResolvedValue(true);
        cacheKeyGenerator.generateKey.mockReturnValue('test:cache:key');
        cacheService.get.mockResolvedValue(null);
        cacheService.set.mockResolvedValue(undefined);

        const observable = await interceptor.intercept(context, next);
        const result = await firstValueFrom(observable);

        expect(result).toBe(freshResult);
        expect(cacheService.get).toHaveBeenCalledWith('test:cache:key');
        expect(cacheService.set).toHaveBeenCalledWith('test:cache:key', freshResult, 300);
    });

    it('should skip caching when skipCache is true', async () => {
        const context = createMockExecutionContext();
        const next = createMockCallHandler('result');

        reflector.get.mockReturnValue({
            ttl: 300,
            skipCache: true
        });

        const observable = await interceptor.intercept(context, next);
        const result = await firstValueFrom(observable);

        expect(result).toBe('result');
        expect(cacheService.get).not.toHaveBeenCalled();
    });

    it('should fallback to direct execution when cache is unavailable', async () => {
        const context = createMockExecutionContext();
        const next = createMockCallHandler('result');

        reflector.get.mockReturnValue({ ttl: 300 });
        cacheService.isAvailable.mockResolvedValue(false);

        const observable = await interceptor.intercept(context, next);
        const result = await firstValueFrom(observable);

        expect(result).toBe('result');
        expect(cacheService.get).not.toHaveBeenCalled();
    });
});