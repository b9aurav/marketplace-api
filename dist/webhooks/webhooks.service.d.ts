export declare class WebhooksService {
    private readonly logger;
    handleStripeWebhook(payload: any, signature: string): Promise<{
        received: boolean;
    }>;
    handleSmsWebhook(payload: any): Promise<{
        received: boolean;
    }>;
}
