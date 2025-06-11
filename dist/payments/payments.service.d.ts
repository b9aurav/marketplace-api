import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
export declare class PaymentsService {
    getPaymentMethods(userId: string): Promise<{
        id: string;
        card_last4: string;
        type: string;
        is_default: boolean;
    }[]>;
    addPaymentMethod(userId: string, addPaymentMethodDto: AddPaymentMethodDto): Promise<{
        id: string;
        message: string;
    }>;
    processPayment(userId: string, processPaymentDto: ProcessPaymentDto): Promise<{
        transaction_id: string;
        status: string;
    }>;
    topUpWallet(userId: string, topUpWalletDto: TopUpWalletDto): Promise<{
        new_balance: number;
        transaction_id: string;
    }>;
}
