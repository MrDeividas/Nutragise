import { supabase } from './supabase';

export type ApplyReferralResult =
  | { ok: true; referrerId: string; referrerName?: string; code: string }
  | { ok: false; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code: 'That referral code doesn’t look right.',
  self_referral: 'You can’t use your own referral code.',
  already_referred: 'A referral is already linked to this account.',
  empty_code: 'Enter a referral code, or skip.',
  not_authenticated: 'Please sign in again.',
  profile_missing: 'Profile not found. Try again in a moment.',
};

class ReferralService {
  friendlyError(code: string) {
    return ERROR_MESSAGES[code] || 'Couldn’t apply that referral code.';
  }

  /** Fetch this user's shareable referral code (auto-created on profile insert). */
  async getMyReferralCode(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('getMyReferralCode:', error);
      return null;
    }
    return data?.referral_code ?? null;
  }

  /**
   * Apply a friend's code for the signed-in user.
   * Logs into `referrals` and sets `profiles.referred_by`.
   * Empty code is a no-op success.
   */
  async applyReferralCode(code: string | undefined | null): Promise<ApplyReferralResult> {
    const trimmed = (code || '').trim();
    if (!trimmed) {
      return { ok: true, referrerId: '', code: '' };
    }

    const { data, error } = await supabase.rpc('apply_referral_code', {
      p_code: trimmed,
    });

    if (error) {
      console.error('apply_referral_code rpc:', error);
      return { ok: false, error: error.message };
    }

    const result = data as {
      ok?: boolean;
      error?: string;
      referrer_id?: string;
      referrer_display_name?: string;
      referrer_username?: string;
      referral_code?: string;
    };

    if (!result?.ok) {
      return { ok: false, error: result?.error || 'invalid_code' };
    }

    return {
      ok: true,
      referrerId: result.referrer_id || '',
      referrerName: result.referrer_display_name || result.referrer_username,
      code: result.referral_code || trimmed.toUpperCase(),
    };
  }

  /** People this user has successfully referred. */
  async listMyReferrals(userId: string) {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referral_code, created_at, referred_id')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('listMyReferrals:', error);
      return [];
    }
    return data || [];
  }
}

export const referralService = new ReferralService();
