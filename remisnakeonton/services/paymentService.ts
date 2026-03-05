
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
        // Use environment variable or detect from current deployment
        this.backendUrl = (import.meta as any).env?.VITE_BACKEND_URL ||
            window.location.origin.replace('snakeonton.vercel.app', 'your-backend-url.railway.app') ||
            'http://localhost:3000';

        console.log('[PaymentService] Backend URL:', this.backendUrl);
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
            console.log('[PaymentService] Starting payment process:', params);

            // Check if TonService is initialized
            if (!tonService.isReady()) {
                console.error('[PaymentService] TonService not initialized! Attempting to initialize...');
                const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
                await tonService.init(manifestUrl);

                // Wait a moment for initialization
                await new Promise(resolve => setTimeout(resolve, 500));

                if (!tonService.isReady()) {
                    return {
                        success: false,
                        message: 'TON Connect is not ready. Please refresh the page and try again.'
                    };
                }
                console.log('[PaymentService] TonService initialized successfully');
            }

            console.log('[PaymentService] About to call tonService.sendTransaction');
            const txSuccess = await tonService.sendTransaction({
                toAddress: params.toAddress,
                amountNanoTon: params.amountNanoTon,
                comment: params.comment
            });

            console.log('[PaymentService] Transaction result:', txSuccess);

            // Log detailed error if transaction failed
            if (!txSuccess) {
                console.error('[PaymentService] Transaction failed - check tonService logs above');
            }

            if (!txSuccess) {
                return {
                    success: false,
                    message: 'Transaction was cancelled or failed. Please try again.'
                };
            }

            // Step 2: For TESTNET - auto-approve without backend verification
            // In production, you would verify on backend here
            const isTestnet = (import.meta as any).env?.VITE_TON_NETWORK === 'testnet' ||
                params.toAddress.includes('QC9q38UghP0eT3E9RwXBdjAThZ') ||
                params.toAddress.includes('0QC2QYb'); // additional testnet address check

            if (isTestnet) {
                console.log('[PaymentService] Testnet mode - auto-approving transaction');
                return {
                    success: true,
                    message: 'Transaction successful! Item unlocked.',
                    data: {
                        type: params.type,
                        amount: params.amount,
                        itemName: params.itemName,
                        verified: true
                    }
                };
            }

            // Step 3: For MAINNET - verify on backend (requires deployed backend)
            const tempTxHash = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
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
                message: error.message || 'Payment processing failed. Please check your wallet balance and try again.'
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

