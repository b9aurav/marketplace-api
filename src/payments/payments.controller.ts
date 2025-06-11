import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TopUpWalletDto } from './dto/topup-wallet.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  @ApiOperation({ summary: 'Get saved payment methods' })
  @ApiResponse({ status: 200, description: 'Returns user payment methods' })
  async getPaymentMethods(@Request() req) {
    return this.paymentsService.getPaymentMethods(req.user.id);
  }

  @Post('methods')
  @ApiOperation({ summary: 'Add payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added' })
  async addPaymentMethod(@Request() req, @Body() addPaymentMethodDto: AddPaymentMethodDto) {
    return this.paymentsService.addPaymentMethod(req.user.id, addPaymentMethodDto);
  }

  @Post('process')
  @ApiOperation({ summary: 'Process order payment' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processPayment(@Request() req, @Body() processPaymentDto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(req.user.id, processPaymentDto);
  }

  @Post('wallet/topup')
  @ApiOperation({ summary: 'Top up digital wallet' })
  @ApiResponse({ status: 200, description: 'Wallet topped up' })
  async topUpWallet(@Request() req, @Body() topUpWalletDto: TopUpWalletDto) {
    return this.paymentsService.topUpWallet(req.user.id, topUpWalletDto);
  }
}