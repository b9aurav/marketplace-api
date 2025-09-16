import { Test, TestingModule } from "@nestjs/testing";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "../services/dashboard.service";
import { AdminGuard } from "../guards/admin.guard";
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";

describe("DashboardController", () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getDashboardMetrics: jest.fn(),
            getSalesAnalytics: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(AdminAuditInterceptor)
      .useValue({ intercept: jest.fn((context, next) => next.handle()) })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardMetrics", () => {
    it("should return dashboard metrics", async () => {
      const mockMetrics = {
        total_users: 100,
        total_products: 50,
        total_orders: 200,
        total_revenue: 10000,
        user_growth: 10,
        order_growth: 15,
        revenue_growth: 20,
        active_users: 90,
        pending_orders: 5,
        low_stock_products: 3,
      };

      dashboardService.getDashboardMetrics.mockResolvedValue(mockMetrics);

      const query = { date_from: "2024-01-01", date_to: "2024-01-31" };
      const result = await controller.getDashboardMetrics(query);

      expect(result).toEqual(mockMetrics);
      expect(dashboardService.getDashboardMetrics).toHaveBeenCalledWith(query);
    });

    it("should handle empty query parameters", async () => {
      const mockMetrics = {
        total_users: 100,
        total_products: 50,
        total_orders: 200,
        total_revenue: 10000,
        user_growth: 10,
        order_growth: 15,
        revenue_growth: 20,
        active_users: 90,
        pending_orders: 5,
        low_stock_products: 3,
      };

      dashboardService.getDashboardMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getDashboardMetrics({});

      expect(result).toEqual(mockMetrics);
      expect(dashboardService.getDashboardMetrics).toHaveBeenCalledWith({});
    });
  });

  describe("getSalesAnalytics", () => {
    it("should return sales analytics", async () => {
      const mockAnalytics = {
        sales_trend: [
          {
            date: "2024-01-01",
            revenue: 1000,
            orders: 10,
            average_order_value: 100,
          },
          {
            date: "2024-01-02",
            revenue: 1200,
            orders: 12,
            average_order_value: 100,
          },
        ],
        total_revenue: 5000,
        total_orders: 50,
        growth_rate: 15,
        average_order_value: 100,
        peak_sales_day: "2024-01-02",
        peak_sales_amount: 1200,
      };

      dashboardService.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      const query = {
        date_from: "2024-01-01",
        date_to: "2024-01-31",
        interval: "day",
      };

      const result = await controller.getSalesAnalytics(query);

      expect(result).toEqual(mockAnalytics);
      expect(dashboardService.getSalesAnalytics).toHaveBeenCalledWith(query);
    });

    it("should handle different intervals", async () => {
      const mockAnalytics = {
        sales_trend: [
          {
            date: "2024-01",
            revenue: 30000,
            orders: 300,
            average_order_value: 100,
          },
          {
            date: "2024-02",
            revenue: 35000,
            orders: 350,
            average_order_value: 100,
          },
        ],
        total_revenue: 65000,
        total_orders: 650,
        growth_rate: 25,
        average_order_value: 100,
        peak_sales_day: "2024-02",
        peak_sales_amount: 35000,
      };

      dashboardService.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      const query = {
        date_from: "2024-01-01",
        date_to: "2024-02-29",
        interval: "month",
      };

      const result = await controller.getSalesAnalytics(query);

      expect(result).toEqual(mockAnalytics);
      expect(dashboardService.getSalesAnalytics).toHaveBeenCalledWith(query);
    });

    it("should use default interval when not specified", async () => {
      const mockAnalytics = {
        sales_trend: [],
        total_revenue: 0,
        total_orders: 0,
        growth_rate: 0,
        average_order_value: 0,
        peak_sales_day: "",
        peak_sales_amount: 0,
      };

      dashboardService.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      const query = {
        date_from: "2024-01-01",
        date_to: "2024-01-31",
      };

      await controller.getSalesAnalytics(query);

      expect(dashboardService.getSalesAnalytics).toHaveBeenCalledWith({
        ...query,
        interval: undefined, // Service will handle default
      });
    });
  });
});
