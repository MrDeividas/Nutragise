/**
 * IAP Service — RevenueCat wrapper
 *
 * Single source of truth for Pro subscription purchases on iOS (Apple IAP) and
 * Android (Google Play Billing). The RevenueCat webhook
 * (supabase/functions/revenuecat-webhook) keeps `profiles.is_pro` in sync;
 * client code here only triggers the purchase / restore flow and refreshes
 * the local profile after a successful transaction.
 *
 * Required env (loaded via react-native-dotenv / @env):
 *   REVENUECAT_IOS_API_KEY      — Apple public SDK key from RevenueCat
 *   REVENUECAT_ANDROID_API_KEY  — Google public SDK key from RevenueCat
 */

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { env } from './env';

export const PRO_ENTITLEMENT_ID = 'pro';

export type PurchaseOutcome =
  | { status: 'success'; customerInfo: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

class IAPService {
  private configured = false;
  private currentUserId: string | null = null;

  /**
   * Configure RevenueCat exactly once per app launch. Safe to call multiple
   * times — subsequent calls are no-ops.
   */
  configure(): boolean {
    if (this.configured) return true;

    const apiKey =
      Platform.OS === 'ios'
        ? env.revenueCatIosApiKey
        : Platform.OS === 'android'
        ? env.revenueCatAndroidApiKey
        : '';

    if (!apiKey) {
      console.warn(
        `RevenueCat: missing API key for ${Platform.OS}. Pro purchases will be unavailable until REVENUECAT_${Platform.OS.toUpperCase()}_API_KEY is set.`
      );
      return false;
    }

    try {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
      Purchases.configure({ apiKey });
      this.configured = true;
      return true;
    } catch (err) {
      console.error('RevenueCat configure failed:', err);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Link RevenueCat's anonymous app user to the signed-in Supabase user id.
   * Webhooks reference this id when updating `profiles`.
   */
  async logIn(userId: string): Promise<void> {
    if (!this.configured && !this.configure()) return;
    if (this.currentUserId === userId) return;

    try {
      await Purchases.logIn(userId);
      this.currentUserId = userId;
    } catch (err) {
      console.error('RevenueCat logIn failed:', err);
    }
  }

  async logOut(): Promise<void> {
    if (!this.configured) return;

    try {
      await Purchases.logOut();
      this.currentUserId = null;
    } catch (err) {
      // logOut throws if the user is already anonymous — safe to ignore.
      const message = err instanceof Error ? err.message : String(err);
      if (!message.toLowerCase().includes('anonymous')) {
        console.error('RevenueCat logOut failed:', err);
      }
    }
  }

  /**
   * Fetch the active offering (configured as the default in the RevenueCat
   * dashboard). Returns null if RevenueCat is not configured or no offering
   * is available for this platform.
   */
  async getProOffering(): Promise<PurchasesOffering | null> {
    if (!this.configured && !this.configure()) return null;

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current ?? null;
    } catch (err) {
      console.error('RevenueCat getOfferings failed:', err);
      return null;
    }
  }

  /**
   * Pick the monthly package from the current offering, falling back to the
   * first available package if monthly is not exposed.
   */
  async getProPackage(): Promise<PurchasesPackage | null> {
    const offering = await this.getProOffering();
    if (!offering) return null;
    return offering.monthly ?? offering.availablePackages[0] ?? null;
  }

  async purchasePro(): Promise<PurchaseOutcome> {
    if (!this.configured && !this.configure()) {
      return { status: 'error', message: 'In-app purchases are not available.' };
    }

    const pkg = await this.getProPackage();
    if (!pkg) {
      return {
        status: 'error',
        message: 'Pro subscription is not available right now. Please try again later.',
      };
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { status: 'success', customerInfo };
    } catch (err: any) {
      if (err?.userCancelled) return { status: 'cancelled' };
      const message =
        err?.userInfo?.NSLocalizedDescription || err?.message || 'Purchase failed. Please try again.';
      console.error('RevenueCat purchasePackage failed:', err);
      return { status: 'error', message };
    }
  }

  async restorePurchases(): Promise<PurchaseOutcome> {
    if (!this.configured && !this.configure()) {
      return { status: 'error', message: 'In-app purchases are not available.' };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return { status: 'success', customerInfo };
    } catch (err: any) {
      const message =
        err?.userInfo?.NSLocalizedDescription || err?.message || 'Restore failed. Please try again.';
      console.error('RevenueCat restorePurchases failed:', err);
      return { status: 'error', message };
    }
  }

  hasProEntitlement(customerInfo: CustomerInfo | null | undefined): boolean {
    if (!customerInfo) return false;
    return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]);
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.configured && !this.configure()) return null;
    try {
      return await Purchases.getCustomerInfo();
    } catch (err) {
      console.error('RevenueCat getCustomerInfo failed:', err);
      return null;
    }
  }

  /**
   * Returns a deep link the user can open to manage / cancel their
   * subscription in the App Store or Play Store. Falls back to platform
   * defaults if RevenueCat does not provide one.
   */
  async getManagementUrl(): Promise<string | null> {
    const info = await this.getCustomerInfo();
    if (info?.managementURL) return info.managementURL;

    if (Platform.OS === 'ios') return 'https://apps.apple.com/account/subscriptions';
    if (Platform.OS === 'android') return 'https://play.google.com/store/account/subscriptions';
    return null;
  }
}

export const iapService = new IAPService();
