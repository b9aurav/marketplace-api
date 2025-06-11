"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
let PaymentsService = class PaymentsService {
    async getPaymentMethods(userId) {
        return [
            {
                id: 'pm_1',
                card_last4: '4242',
                type: 'visa',
                is_default: true,
            },
        ];
    }
    async addPaymentMethod(userId, addPaymentMethodDto) {
        return {
            id: 'pm_new',
            message: 'Payment method added successfully',
        };
    }
    async processPayment(userId, processPaymentDto) {
        return {
            transaction_id: 'txn_' + Date.now(),
            status: 'succeeded',
        };
    }
    async topUpWallet(userId, topUpWalletDto) {
        return {
            new_balance: 100 + topUpWalletDto.amount,
            transaction_id: 'wallet_txn_' + Date.now(),
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)()
], PaymentsService);
//# sourceMappingURL=payments.service.js.map