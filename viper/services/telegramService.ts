
import { TelegramUser } from '../types';

/**
 * Telegram Mini App Service
 * Wraps the Telegram WebApp JS SDK (loaded via <script> in index.html)
 * Works gracefully in browser (non-Telegram) context.
 */

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
        TelegramAnalytics?: {
            sendEvent(event: string, params?: Record<string, any>): void;
            setUserProperty(property: string, value: string): void;
        };
    }
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        start_param?: string; // referral code from deep link ?start=xxx
        query_id?: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    ready(): void;
    expand(): void;
    close(): void;
    BackButton: {
        isVisible: boolean;
        show(): void;
        hide(): void;
        onClick(fn: () => void): void;
        offClick(fn: () => void): void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        show(): void;
        hide(): void;
        setText(text: string): void;
        onClick(fn: () => void): void;
        offClick(fn: () => void): void;
        showProgress(leaveActive?: boolean): void;
        hideProgress(): void;
    };
    HapticFeedback: {
        impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
        notificationOccurred(type: 'error' | 'success' | 'warning'): void;
        selectionChanged(): void;
    };
    openLink(url: string): void;
    openTelegramLink(url: string): void;
    openInvoice(url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void): void;
    setHeaderColor(color: string): void;
    setBackgroundColor(color: string): void;
}

class TelegramService {
    private webApp: TelegramWebApp | null = null;

    constructor() {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            this.webApp = window.Telegram.WebApp;
        }
    }

    /**
     * Returns true if the app is running inside Telegram
     */
    public isTelegramContext(): boolean {
        return !!this.webApp && !!this.webApp.initData && this.webApp.initData.length > 0;
    }

    /**
     * Initialize the Telegram Mini App — must be called on startup
     */
    public init(): void {
        if (!this.webApp) return;
        try {
            this.webApp.ready();
            this.webApp.expand();
            // Use dark theme header to match game UI
            this.webApp.setHeaderColor('#0a0a0f');
            this.webApp.setBackgroundColor('#0a0a0f');

            // Initialize Telegram Analytics
            this.initAnalytics();
        } catch (e) {
            console.warn('[TelegramService] init error:', e);
        }
    }

    /**
     * Initialize Telegram Mini Apps Analytics
     */
    private initAnalytics(): void {
        if (window.TelegramAnalytics && this.isTelegramContext()) {
            console.log('[TelegramService] Analytics initialized');
            // Track app launch
            this.trackEvent('app_launch', {
                platform: this.getPlatform(),
                version: '1.0.0'
            });
        } else {
            console.log('[TelegramService] Analytics not available, continuing without it');
        }
    }

    /**
     * Track custom event with Telegram Analytics
     */
    public trackEvent(eventName: string, params?: Record<string, any>): void {
        if (window.TelegramAnalytics && this.isTelegramContext()) {
            try {
                window.TelegramAnalytics.sendEvent(eventName, params);
            } catch (e) {
                // Silently fail - analytics is optional
                console.debug('[TelegramService] Analytics event tracking failed:', e);
            }
        }
    }

    /**
     * Set user property for analytics
     */
    public setUserProperty(property: string, value: string): void {
        if (window.TelegramAnalytics && this.isTelegramContext()) {
            try {
                window.TelegramAnalytics.setUserProperty(property, value);
            } catch (e) {
                // Silently fail - analytics is optional
                console.debug('[TelegramService] Set user property failed:', e);
            }
        }
    }

    /**
     * Get the Telegram user from initDataUnsafe
     * NOTE: For production, validate initData on the backend!
     */
    public getTelegramUser(): TelegramUser | null {
        if (!this.isTelegramContext()) return null;
        return this.webApp?.initDataUnsafe?.user || null;
    }

    /**
     * Get referral start_param from deep link t.me/Bot?start=REFCODE
     */
    public getStartParam(): string | null {
        if (!this.isTelegramContext()) return null;
        return this.webApp?.initDataUnsafe?.start_param || null;
    }

    /**
     * Get raw initData string for backend validation
     */
    public getInitData(): string {
        return this.webApp?.initData || '';
    }

    /**
     * Haptic feedback — game events
     */
    public hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void {
        try {
            this.webApp?.HapticFeedback.impactOccurred(style);
        } catch (_) { }
    }

    public hapticSuccess(): void {
        try {
            this.webApp?.HapticFeedback.notificationOccurred('success');
        } catch (_) { }
    }

    public hapticError(): void {
        try {
            this.webApp?.HapticFeedback.notificationOccurred('error');
        } catch (_) { }
    }

    /**
     * Show / hide Telegram Back Button
     */
    public showBackButton(onClick: () => void): void {
        if (!this.webApp) return;
        this.webApp.BackButton.show();
        this.webApp.BackButton.onClick(onClick);
    }

    public hideBackButton(): void {
        if (!this.webApp) return;
        this.webApp.BackButton.hide();
    }

    /**
     * Open external URL via Telegram browser
     */
    public openLink(url: string): void {
        if (this.webApp) {
            this.webApp.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    }

    /**
     * Open Telegram invoice
     */
    public openInvoice(url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void): void {
        if (this.webApp && this.webApp.openInvoice) {
            this.webApp.openInvoice(url, callback);
        } else {
            console.warn('[TelegramService] openInvoice not available, falling back to openLink');
            this.openLink(url);
            if (callback) callback('pending'); // Can't know the status if opened externally
        }
    }

    /**
     * Get the Telegram platform (ios / android / web / unknown)
     */
    public getPlatform(): string {
        return this.webApp?.platform || 'unknown';
    }

    /**
     * Get Telegram color scheme
     */
    public getColorScheme(): 'light' | 'dark' {
        return this.webApp?.colorScheme || 'dark';
    }
}

export const telegramService = new TelegramService();
