"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor() {
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async handleStripeWebhook(payload, signature) {
        this.logger.log('Received Stripe webhook', { type: payload.type });
        switch (payload.type) {
            case 'payment_intent.succeeded':
                this.logger.log('Payment succeeded', { paymentIntentId: payload.data.object.id });
                break;
            case 'payment_intent.payment_failed':
                this.logger.log('Payment failed', { paymentIntentId: payload.data.object.id });
                break;
            default:
                this.logger.log('Unhandled event type', { type: payload.type });
        }
        return { received: true };
    }
    async handleSmsWebhook(payload) {
        this.logger.log('Received SMS webhook', { status: payload.MessageStatus });
        return { received: true };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)()
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map