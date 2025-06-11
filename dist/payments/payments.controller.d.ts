import { PaymentsService } from './payments.service';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getPaymentMethods(req: any): Promise<{
        id: string;
        card_last4: string;
        type: string;
        is_default: boolean;
    }[]>;
    addPaymentMethod(req: any, addPaymentMethodDto: AddPaymentMethodDto): Promise<{
        id: string;
        message: string;
    }>;
    processPayment(req: any, processPaymentDto: ProcessPaymentDto): Promise<{
        transaction_id: string;
        status: string;
    }>;
    topUpWallet(req: any, topUpWalletDto: TopUpWalletDto): Promise<{
        new_balance: number;
        transaction_id: string;
    }>;
}
