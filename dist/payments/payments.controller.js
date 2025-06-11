"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const add_payment_method_dto_1 = require("./dto/add-payment-method.dto");
const process_payment_dto_1 = require("./dto/process-payment.dto");
const topup_wallet_dto_1 = require("./dto/topup-wallet.dto");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async getPaymentMethods(req) {
        return this.paymentsService.getPaymentMethods(req.user.id);
    }
    async addPaymentMethod(req, addPaymentMethodDto) {
        return this.paymentsService.addPaymentMethod(req.user.id, addPaymentMethodDto);
    }
    async processPayment(req, processPaymentDto) {
        return this.paymentsService.processPayment(req.user.id, processPaymentDto);
    }
    async topUpWallet(req, topUpWalletDto) {
        return this.paymentsService.topUpWallet(req.user.id, topUpWalletDto);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('methods'),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved payment methods' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user payment methods' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Post)('methods'),
    (0, swagger_1.ApiOperation)({ summary: 'Add payment method' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment method added' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_payment_method_dto_1.AddPaymentMethodDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "addPaymentMethod", null);
__decorate([
    (0, common_1.Post)('process'),
    (0, swagger_1.ApiOperation)({ summary: 'Process order payment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment processed' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, process_payment_dto_1.ProcessPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)('wallet/topup'),
    (0, swagger_1.ApiOperation)({ summary: 'Top up digital wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet topped up' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, topup_wallet_dto_1.TopUpWalletDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "topUpWallet", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map