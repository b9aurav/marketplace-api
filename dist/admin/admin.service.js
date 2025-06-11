"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
let AdminService = class AdminService {
    async getDashboardSummary() {
        return {
            total_sales: 125000,
            active_users: 1250,
            pending_orders: 45,
            total_products: 500,
        };
    }
    async getSalesAnalytics(range) {
        const dates = [];
        const revenue = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
            revenue.push(Math.floor(Math.random() * 5000) + 1000);
        }
        return {
            dates,
            revenue,
            range: range || 'last_7_days',
        };
    }
    async getUsers(search) {
        return {
            users: [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    created_at: new Date(),
                    status: 'active',
                },
            ],
            total: 1,
        };
    }
    async blockUser(userId) {
        return {
            message: 'User blocked successfully',
            user_id: userId,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map