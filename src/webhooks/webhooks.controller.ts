import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";

@ApiTags("Webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Stripe webhook events" })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers("stripe-signature") signature: string,
  ) {
    return this.webhooksService.handleStripeWebhook(payload);
  }

  @Post("sms")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle SMS delivery status webhook" })
  @ApiResponse({
    status: 200,
    description: "SMS webhook processed successfully",
  })
  async handleSmsWebhook(@Body() payload: any) {
    return this.webhooksService.handleSmsWebhook(payload);
  }
}
