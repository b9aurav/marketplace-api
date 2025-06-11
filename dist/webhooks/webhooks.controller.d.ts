import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleStripeWebhook(payload: any, signature: string): Promise<{
        received: boolean;
    }>;
    handleSmsWebhook(payload: any): Promise<{
        received: boolean;
    }>;
}
