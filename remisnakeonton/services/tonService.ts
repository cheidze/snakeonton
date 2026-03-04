
/**
 * TON Connect Service
 * Wraps @tonconnect/ui-react for wallet connect/disconnect/send.
 * 
 * IMPORTANT: Install with:
 *   npm install @tonconnect/ui-react
 * 
 * TonConnectUI is initialized once at the App level and passed around via
 * this singleton service.
 */

// We use dynamic import to avoid crashing in environments where the package
// isn't installed yet. The service gracefully falls back.
type TonConnectUIType = import('@tonconnect/ui-react').TonConnectUI;

class TonService {
    private instance: TonConnectUIType | null = null;
    private isAvailable = false;

    /**
     * Initialize TON Connect UI — call once in your React app root.
     * manifestUrl must be the publicly accessible URL of tonconnect-manifest.json
     */
    public async init(manifestUrl: string): Promise<void> {
        try {
            const { TonConnectUI } = await import('@tonconnect/ui-react');
            this.instance = new TonConnectUI({
                manifestUrl,
            });
            this.isAvailable = true;
            console.log('[TonService] TonConnectUI initialized');
        } catch (e) {
            console.warn('[TonService] @tonconnect/ui-react not installed. Run: npm install @tonconnect/ui-react');
            this.isAvailable = false;
        }
    }

    public isReady(): boolean {
        return this.isAvailable && !!this.instance;
    }

    /**
     * Open the TON wallet chooser modal (TonKeeper, TonSpace, etc.)
     */
    public async connectWallet(): Promise<string | null> {
        if (!this.instance) return null;
        try {
            const result = await this.instance.connectWallet();
            return result?.account?.address || null;
        } catch (e) {
            console.error('[TonService] connectWallet error:', e);
            return null;
        }
    }

    /**
     * Disconnect the currently connected wallet
     */
    public async disconnectWallet(): Promise<void> {
        if (!this.instance) return;
        try {
            await this.instance.disconnect();
        } catch (e) {
            console.error('[TonService] disconnectWallet error:', e);
        }
    }

    /**
     * Get the currently connected wallet address (raw or user-friendly format)
     */
    public getWalletAddress(): string | null {
        if (!this.instance) return null;
        try {
            const wallet = this.instance.wallet;
            if (!wallet) return null;
            return wallet.account?.address || null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Check if a wallet is currently connected
     */
    public isConnected(): boolean {
        return !!this.getWalletAddress();
    }

    /**
     * Format a TON address for display (UQ…1234 style)
     */
    public formatAddress(address: string | null): string {
        if (!address) return '';
        if (address.length <= 12) return address;
        return `${address.slice(0, 6)}…${address.slice(-4)}`;
    }

    /**
     * Send a TON transaction (used for withdraw flow and purchases)
     * amount is in nanoTON (1 TON = 1_000_000_000 nanoTON)
     * 
     * IMPORTANT: For production, generate the transaction on the backend and
     * only use this to prompt signing. This method sends raw TON transfers.
     */
    public async sendTransaction(params: {
        toAddress: string;
        amountNanoTon: string; // string to avoid precision issues
        comment?: string;
    }): Promise<boolean> {
        if (!this.instance) return false;
        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360, // 6 min expiry
                messages: [
                    {
                        address: params.toAddress,
                        amount: params.amountNanoTon,
                        // Properly encode comment as cell payload
                        payload: params.comment
                            ? this.createCommentPayload(params.comment)
                            : undefined,
                    },
                ],
            };
            await this.instance.sendTransaction(transaction);
            return true;
        } catch (e) {
            console.error('[TonService] sendTransaction error:', e);
            return false;
        }
    }

    /**
     * Create a properly formatted comment payload for TON transaction
     */
    private createCommentPayload(comment: string): string {
        // TON comment payload needs to be base64 encoded with text tag (0x00000000)
        const textTag = new Uint8Array(4); // 4 bytes for text tag (0x00000000)
        const commentBytes = new TextEncoder().encode(comment);
        const payload = new Uint8Array(textTag.length + commentBytes.length);
        payload.set(textTag, 0);
        payload.set(commentBytes, 4);
        return btoa(String.fromCharCode(...payload));
    }

    /**
     * Subscribe to wallet changes (connect/disconnect events)
     */
    public onWalletChange(callback: (address: string | null) => void): () => void {
        if (!this.instance) return () => { };
        const unsubscribe = this.instance.onStatusChange((wallet) => {
            callback(wallet?.account?.address || null);
        });
        return unsubscribe;
    }

    /**
     * Get the TonConnectUI instance for use with TonConnectUIProvider (React)
     */
    public getInstance(): TonConnectUIType | null {
        return this.instance;
    }

    /**
     * Convert TON to nanoTON (string)
     */
    public tonToNano(ton: number): string {
        return String(Math.round(ton * 1_000_000_000));
    }
}

export const tonService = new TonService();
