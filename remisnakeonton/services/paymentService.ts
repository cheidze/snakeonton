
/**
 * Payment Service - Handles TON transaction verification and processing
 * 
 * This service bridges the frontend TON transactions with backend verification.
 */

import { tonService } from './tonService';

export interface TransactionVerification {
    txHash: string;
    userId: string;
    type: 'buy_skin' | 'buy_collectible' | 'withdraw';
    amount: number;
    itemName?: string;
}

export interface VerificationResult {
    success: boolean;
    message?: string;
    data?: any;
    estimatedTime?: string;
}

class PaymentService {
    private backendUrl: string;

    constructor() {
        // Use environment variable or default to localhost for development
        this.backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000';
    }

    /**
     * Send TON transaction and verify on backend
     */
    async processPayment(params: {
        toAddress: string;
        amountNanoTon: string;
        comment: string;
        userId: string;
        type: 'buy_skin' | 'buy_collectible';
        amount: number; // in TON
        itemName?: string;
    }): Promise<VerificationResult> {
        try {
            // Step 1: Send transaction via TON Connect
            const txSuccess = await tonService.sendTransaction({
                toAddress: params.toAddress,
                amountNanoTon: params.amountNanoTon,
                comment: params.comment
            });

            if (!txSuccess) {
                return {
                    success: false,
                    message: 'Transaction was cancelled or failed'
                };
            }

            // Step 2: Get transaction hash (this requires reading from wallet after tx)
            // For now, we'll use a placeholder - in production, extract from wallet state
            const tempTxHash = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // Step 3: Verify transaction on backend
            const result = await this.verifyTransaction({
                txHash: tempTxHash,
                userId: params.userId,
                type: params.type,
                amount: params.amount,
                itemName: params.itemName
            });

            return result;

        } catch (error: any) {
            console.error('[PaymentService] Process payment error:', error);
            return {
                success: false,
                message: error.message || 'Payment processing failed'
            };
        }
    }

    /**
     * Verify transaction on backend
     */
    private async verifyTransaction(txData: TransactionVerification): Promise<VerificationResult> {
        try {
            const response = await fetch(`${this.backendUrl}/api/verify-transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(txData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Verification failed');
            }

            const result = await response.json();
            return result;

        } catch (error: any) {
            console.error('[PaymentService] Verify transaction error:', error);
            return {
                success: false,
                message: error.message || 'Transaction verification failed'
            };
        }
    }

    /**
     * Process withdrawal request
     */
    async processWithdrawal(params: {
        userId: string;
        tonAddress: string;
        goldAmount: number;
    }): Promise<VerificationResult> {
        try {
            const response = await fetch(`${this.backendUrl}/api/process-withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Withdrawal failed');
            }

            const result = await response.json();
            return result;

        } catch (error: any) {
            console.error('[PaymentService] Withdrawal error:', error);
            return {
                success: false,
                message: error.message || 'Withdrawal request failed'
            };
        }
    }

    /**
     * Format TON amount for display
     */
    formatTonAmount(nanoTon: string): string {
        const ton = parseInt(nanoTon) / 1_000_000_000;
        return ton.toFixed(4);
    }

    /**
     * Validate minimum withdrawal amount
     */
    validateWithdrawal(goldAmount: number): { valid: boolean; message?: string } {
        const MIN_WITHDRAW_GOLD = 100_000; // From economyService
        
        if (goldAmount < MIN_WITHDRAW_GOLD) {
            return {
                valid: false,
                message: `Minimum withdrawal is ${MIN_WITHDRAW_GOLD.toLocaleString()} gold`
            };
        }

        return { valid: true };
    }
}

export const paymentService = new PaymentService();
