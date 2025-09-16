import { Test, TestingModule } from "@nestjs/testing";
import { CacheKeyGenerator } from "./cache-key-generator.service";

describe("CacheKeyGenerator", () => {
  let service: CacheKeyGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheKeyGenerator],
    }).compile();

    service = module.get<CacheKeyGenerator>(CacheKeyGenerator);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateKey", () => {
    it("should generate key with prefix and params", () => {
      const prefix = "admin:users";
      const params = { page: 1, limit: 10, search: "john" };

      const result = service.generateKey(prefix, params);

      expect(result).toBe("admin:users:limit=10:page=1:search=john");
    });

    it("should handle empty params", () => {
      const prefix = "admin:users";
      const params = {};

      const result = service.generateKey(prefix, params);

      expect(result).toBe("admin:users");
    });

    it("should handle null and undefined values", () => {
      const prefix = "admin:users";
      const params = { page: 1, search: null, filter: undefined };

      const result = service.generateKey(prefix, params);

      expect(result).toBe("admin:users:page=1");
    });

    it("should handle object values", () => {
      const prefix = "admin:users";
      const params = { filters: { status: "active", role: "admin" } };

      const result = service.generateKey(prefix, params);

      expect(result).toBe(
        'admin:users:filters={"status":"active","role":"admin"}',
      );
    });

    it("should handle array values", () => {
      const prefix = "admin:products";
      const params = { categories: ["electronics", "books"] };

      const result = service.generateKey(prefix, params);

      expect(result).toBe("admin:products:categories=electronics,books");
    });

    it("should sort params for consistent keys", () => {
      const prefix = "admin:users";
      const params1 = { page: 1, limit: 10, search: "john" };
      const params2 = { search: "john", limit: 10, page: 1 };

      const result1 = service.generateKey(prefix, params1);
      const result2 = service.generateKey(prefix, params2);

      expect(result1).toBe(result2);
    });
  });

  describe("generatePatternKey", () => {
    it("should generate pattern key", () => {
      const prefix = "admin:users";
      const pattern = "*";

      const result = service.generatePatternKey(prefix, pattern);

      expect(result).toBe("admin:users:*");
    });
  });

  describe("generateSimpleKey", () => {
    it("should generate simple key with string id", () => {
      const prefix = "admin:user";
      const id = "user-123";

      const result = service.generateSimpleKey(prefix, id);

      expect(result).toBe("admin:user:user-123");
    });

    it("should generate simple key with number id", () => {
      const prefix = "admin:product";
      const id = 456;

      const result = service.generateSimpleKey(prefix, id);

      expect(result).toBe("admin:product:456");
    });
  });

  describe("generateListKey", () => {
    it("should generate list key with pagination", () => {
      const prefix = "admin:users:list";
      const page = 2;
      const limit = 20;
      const filters = { status: "active" };

      const result = service.generateListKey(prefix, page, limit, filters);

      expect(result).toBe("admin:users:list:limit=20:page=2:status=active");
    });

    it("should use default values", () => {
      const prefix = "admin:users:list";

      const result = service.generateListKey(prefix);

      expect(result).toBe("admin:users:list:limit=10:page=1");
    });
  });

  describe("generateAnalyticsKey", () => {
    it("should generate analytics key with date range", () => {
      const prefix = "admin:sales:analytics";
      const dateFrom = new Date("2023-01-01");
      const dateTo = new Date("2023-01-31");
      const interval = "day";

      const result = service.generateAnalyticsKey(
        prefix,
        dateFrom,
        dateTo,
        interval,
      );

      expect(result).toBe(
        "admin:sales:analytics:from=2023-01-01:interval=day:to=2023-01-31",
      );
    });

    it("should handle missing dates", () => {
      const prefix = "admin:sales:analytics";

      const result = service.generateAnalyticsKey(prefix);

      expect(result).toBe("admin:sales:analytics");
    });

    it("should handle partial date range", () => {
      const prefix = "admin:sales:analytics";
      const dateFrom = new Date("2023-01-01");

      const result = service.generateAnalyticsKey(prefix, dateFrom);

      expect(result).toBe("admin:sales:analytics:from=2023-01-01");
    });
  });
});
