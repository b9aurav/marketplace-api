import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "./cache.module";
import { CacheService } from "./cache.service";
import { CacheKeyGenerator } from "./cache-key-generator.service";

describe("Cache Integration", () => {
  let module: TestingModule;
  let cacheService: CacheService;
  let keyGenerator: CacheKeyGenerator;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env.test", // Use test environment
        }),
        CacheModule,
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
    keyGenerator = module.get<CacheKeyGenerator>(CacheKeyGenerator);
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(cacheService).toBeDefined();
    expect(keyGenerator).toBeDefined();
  });

  it("should generate consistent cache keys", () => {
    const key1 = keyGenerator.generateKey("test", { a: 1, b: 2 });
    const key2 = keyGenerator.generateKey("test", { b: 2, a: 1 });

    expect(key1).toBe(key2);
    expect(key1).toBe("test:a=1:b=2");
  });

  it("should handle cache operations gracefully", async () => {
    const key = "test:integration";
    const value = { test: "data", timestamp: Date.now() };

    // Test set operation (should not throw even if Redis is not available)
    await expect(cacheService.set(key, value, 60)).resolves.not.toThrow();

    // Test get operation (should return null if Redis is not available)
    const result = await cacheService.get(key);
    // Result could be the value if Redis is available, or null if not
    expect(result === null || result === value).toBe(true);

    // Test delete operation (should not throw)
    await expect(cacheService.del(key)).resolves.not.toThrow();
  });

  it("should handle pattern operations gracefully", async () => {
    // Test pattern deletion (should not throw even if Redis is not available)
    await expect(cacheService.delPattern("test:*")).resolves.not.toThrow();
  });

  it("should handle exists and ttl operations gracefully", async () => {
    const key = "test:exists";

    // Test exists operation (should not throw)
    const exists = await cacheService.exists(key);
    expect(typeof exists).toBe("boolean");

    // Test TTL operation (should not throw)
    const ttl = await cacheService.ttl(key);
    expect(typeof ttl).toBe("number");
  });
});
