export declare class AdminService {
    getDashboardSummary(): Promise<{
        total_sales: number;
        active_users: number;
        pending_orders: number;
        total_products: number;
    }>;
    getSalesAnalytics(range?: string): Promise<{
        dates: any[];
        revenue: any[];
        range: string;
    }>;
    getUsers(search?: string): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
            created_at: Date;
            status: string;
        }[];
        total: number;
    }>;
    blockUser(userId: string): Promise<{
        message: string;
        user_id: string;
    }>;
}
