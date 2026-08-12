/**
 * IAP Service — RevenueCat wrapper
 *
 * Soft-loads react-native-purchases so Expo Go / missing native binaries
 * don't blank the whole app at import time.
 */

import { Platform } from 'react-native';
import { env } from './env';

export const PRO_ENTITLEMENT_ID = 'pro';

type CustomerInfo = any;
type PurchasesOffering = any;
type PurchasesPackage = any;

let Purchases: any = null;
let LOG_LEVEL: any = { WARN: 2 };

try {
  const mod = require('react-native-purchases');
  Purchases = mod.default ?? mod;
  if (mod.LOG_LEVEL) LOG_LEVEL = mod.LOG_LEVEL;
} catch (e) {
  console.warn('react-native-purchases unavailable (Expo Go / missing native module):', e);
}

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
    if (!Purchases) {
      console.warn('RevenueCat: native module missing — Pro purchases unavailable in this build.');
      return false;
    }

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

  /**
   * Read introductory / free-trial metadata from a RevenueCat package.
   * Free trials must be configured on the store product (App Store / Play)
   * and synced in RevenueCat — this only surfaces what’s on the package.
   */
  getTrialInfo(pkg: PurchasesPackage | null | undefined): {
    hasTrial: boolean;
    trialDays: number;
    billingStartsOn: Date;
    trialLabel: string;
  } {
    const fallbackDays = 7;
    const product = pkg?.product;
    const intro = product?.introPrice;

    let trialDays = fallbackDays;
    let hasTrial = false;

    if (intro) {
      const units = Number(intro.periodNumberOfUnits) || 0;
      const unit = String(intro.periodUnit || '').toUpperCase();
      // Free trial typically has price === 0
      const priceNum = Number(intro.price);
      hasTrial = units > 0 && (Number.isNaN(priceNum) || priceNum === 0);

      if (hasTrial) {
        if (unit.includes('DAY')) trialDays = units;
        else if (unit.includes('WEEK')) trialDays = units * 7;
        else if (unit.includes('MONTH')) trialDays = units * 30;
        else trialDays = units;
      }
    }

    // If RC product has no introPrice yet, still communicate the intended 1-week trial
    // (actual store sheet will only grant a trial once configured on Apple/Google).
    if (!hasTrial) {
      hasTrial = true;
      trialDays = fallbackDays;
    }

    const billingStartsOn = new Date();
    billingStartsOn.setHours(0, 0, 0, 0);
    billingStartsOn.setDate(billingStartsOn.getDate() + trialDays);

    const trialLabel =
      trialDays === 7
        ? '1-week free trial'
        : trialDays === 1
          ? '1-day free trial'
          : `${trialDays}-day free trial`;

    return { hasTrial, trialDays, billingStartsOn, trialLabel };
  }

  formatBillingDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
